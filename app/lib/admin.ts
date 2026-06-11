const ADMIN_API_VERSION = '2025-01';

/**
 * Thin wrapper around the Admin GraphQL endpoint. Returns the parsed `data`
 * object or null when the call can't be made / errors out (fail open).
 */
async function adminGraphql<T>(
  env: Env,
  query: string,
  variables: Record<string, unknown>,
): Promise<T | null> {
  if (!env.PRIVATE_ADMIN_API_TOKEN) return null;
  try {
    const response = await fetch(
      `https://${env.PUBLIC_STORE_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': env.PRIVATE_ADMIN_API_TOKEN,
        },
        body: JSON.stringify({query, variables}),
      },
    );
    if (!response.ok) {
      console.error('Admin API error:', response.status);
      return null;
    }
    const json = (await response.json()) as {
      data?: T;
      errors?: Array<{message: string}>;
    };
    if (json.errors?.length) {
      console.error('Admin API errors:', json.errors);
      return null;
    }
    return json.data ?? null;
  } catch (error) {
    console.error('Admin API request failed:', error);
    return null;
  }
}

// Admin API query — no #graphql tag so Hydrogen codegen skips it
const CUSTOMER_BY_EMAIL_QUERY = `
  query CustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      nodes {
        id
      }
    }
  }
`;

const STAGED_UPLOADS_CREATE = `
  mutation StagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters { name value }
      }
      userErrors { field message }
    }
  }
`;

const FILE_CREATE = `
  mutation FileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        ... on MediaImage { image { url } }
      }
      userErrors { field message }
    }
  }
`;

const NODE_IMAGE_URL = `
  query NodeImageUrl($id: ID!) {
    node(id: $id) {
      ... on MediaImage { image { url } }
    }
  }
`;

/**
 * Uploads an image to Shopify Files via the Admin API (staged upload →
 * fileCreate) and returns the resulting MediaImage GID, usable as the value of
 * a file_reference metafield (e.g. custom.pfp). Returns null on any failure.
 *
 * Customer Account API can't upload files, so this runs server-side with the
 * private Admin token; the GID is then written to the customer's metafield in
 * their own session.
 */
export async function uploadImageToShopify(
  env: Env,
  file: File,
): Promise<string | null> {
  if (!env.PRIVATE_ADMIN_API_TOKEN) return null;
  if (!file || file.size === 0) return null;

  // 1. Ask Shopify for a staged upload target.
  const staged = await adminGraphql<{
    stagedUploadsCreate: {
      stagedTargets: Array<{
        url: string;
        resourceUrl: string;
        parameters: Array<{name: string; value: string}>;
      }>;
      userErrors: Array<{field: string[]; message: string}>;
    };
  }>(env, STAGED_UPLOADS_CREATE, {
    input: [
      {
        filename: file.name || 'avatar',
        mimeType: file.type || 'image/jpeg',
        resource: 'IMAGE',
        httpMethod: 'POST',
        fileSize: String(file.size),
      },
    ],
  });

  const target = staged?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target) {
    console.error('stagedUploadsCreate returned no target', staged);
    return null;
  }

  // 2. POST the binary to the staged target (Google Cloud Storage).
  try {
    const uploadForm = new FormData();
    for (const param of target.parameters) {
      uploadForm.append(param.name, param.value);
    }
    uploadForm.append('file', file);
    const uploadRes = await fetch(target.url, {
      method: 'POST',
      body: uploadForm,
    });
    if (!uploadRes.ok) {
      console.error('Staged upload POST failed:', uploadRes.status);
      return null;
    }
  } catch (error) {
    console.error('Staged upload POST error:', error);
    return null;
  }

  // 3. Register the uploaded file with Shopify Files.
  const created = await adminGraphql<{
    fileCreate: {
      files: Array<{id: string}>;
      userErrors: Array<{field: string[]; message: string}>;
    };
  }>(env, FILE_CREATE, {
    files: [{originalSource: target.resourceUrl, contentType: 'IMAGE'}],
  });

  if (created?.fileCreate?.userErrors?.length) {
    console.error('fileCreate userErrors:', created.fileCreate.userErrors);
  }
  return created?.fileCreate?.files?.[0]?.id ?? null;
}

/**
 * Resolves a MediaImage GID (stored in custom.pfp) to its CDN image URL.
 * Returns null when missing or not yet processed.
 */
export async function resolveMediaImageUrl(
  env: Env,
  gid: string | null | undefined,
): Promise<string | null> {
  if (!gid) return null;
  const data = await adminGraphql<{node: {image?: {url?: string}} | null}>(
    env,
    NODE_IMAGE_URL,
    {id: gid},
  );
  return data?.node?.image?.url ?? null;
}

/**
 * Checks via Admin API whether a customer with this email exists.
 * Returns null when the check cannot be performed (missing token or API error),
 * so callers can fail open instead of blocking auth.
 */
export async function customerEmailExists(
  env: Env,
  email: string,
): Promise<boolean | null> {
  if (!env.PRIVATE_ADMIN_API_TOKEN) return null;

  try {
    const response = await fetch(
      `https://${env.PUBLIC_STORE_DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': env.PRIVATE_ADMIN_API_TOKEN,
        },
        body: JSON.stringify({
          query: CUSTOMER_BY_EMAIL_QUERY,
          variables: {query: `email:${JSON.stringify(email)}`},
        }),
      },
    );

    if (!response.ok) {
      console.error('Admin API error:', response.status);
      return null;
    }

    const json = (await response.json()) as {
      data?: {customers?: {nodes?: Array<{id: string}>}};
      errors?: Array<{message: string}>;
    };

    if (json.errors?.length) {
      console.error('Admin API errors:', json.errors);
      return null;
    }

    return (json.data?.customers?.nodes?.length ?? 0) > 0;
  } catch (error) {
    console.error('Admin API request failed:', error);
    return null;
  }
}
