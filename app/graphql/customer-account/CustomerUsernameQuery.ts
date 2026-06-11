export const CUSTOMER_USERNAME_QUERY = `#graphql
  query CustomerUsername {
    customer {
      metafield(namespace: "custom", key: "username") {
        value
      }
    }
  }
` as const;

export const CUSTOMER_ID_QUERY = `#graphql
  query CustomerIdForAuthorize {
    customer {
      id
    }
  }
` as const;

// Reads both editable profile metafields in one round-trip. pfp stores a
// MediaImage GID (file_reference); resolve it to a URL via the Admin API.
export const CUSTOMER_PROFILE_QUERY = `#graphql
  query CustomerProfile {
    customer {
      id
      firstName
      lastName
      username: metafield(namespace: "custom", key: "username") {
        value
      }
      pfp: metafield(namespace: "custom", key: "pfp") {
        value
      }
    }
  }
` as const;
