# Auth0 Configuration Guide (RBAC)

To fully integrate Auth0 with the `apps/dashboard` (API) and `apps/dashboard-ui` (React Frontend), you will need to configure your Auth0 Tenant Dashboard with the following settings.

## 1. Create the API
1. Navigate to **Applications -> APIs**.
2. Click **Create API**.
3. **Name**: `QR Menu API` (or whatever you prefer)
4. **Identifier (Audience)**: `https://api.qr-menu.example.com` (Use this exact string, as the frontend will request access to this audience).
5. **Signing Algorithm**: `RS256`
6. Once created, go to the API **Settings** tab:
   - Scroll down to **RBAC Settings**.
   - Enable **Enable RBAC**.
   - Enable **Add Permissions in the Access Token**.

## 2. Define API Permissions
Still in your API settings, go to the **Permissions** tab and add the following granular permissions:

| Permission (Scope) | Description |
| :--- | :--- |
| `read:venues` | Can view venues |
| `create:venues` | Can create venues |
| `update:venues` | Can update venues |
| `delete:venues` | Can delete venues |
| `manage:menus` | Can create, update, and compile menus |
| `manage:billing` | Can update subscription tiers |

*(Note: We map these permissions to specific roles so that the token contains the role names via an Auth0 Action, or we can check the scopes directly).*

## 3. Create Roles
Navigate to **User Management -> Roles** and create the following roles. After creating them, attach the relevant permissions from the API you created above.

### `superadmin`
- **Description:** Global administrator for the Workouse platform.
- **Permissions:** All permissions (can do anything).

### `org_owner`
- **Description:** The primary owner of a restaurant organization.
- **Permissions:** `read:venues`, `create:venues`, `update:venues`, `delete:venues`, `manage:menus`, `manage:billing`.

### `org_staff`
- **Description:** A staff member working for a restaurant.
- **Permissions:** `read:venues`, `manage:menus` (but NOT `create:venues` or `manage:billing`).

## 4. Inject Roles into the Access Token (Action)
By default, Auth0 does not put the user's role array into the JWT Access Token. To allow our Hono backend (`packages/auth`) to easily read the roles, we must create a custom claim.

1. Navigate to **Actions -> Library** and click **Create Action** -> **Build from scratch**.
2. **Name**: `Add Roles to Token`
3. **Trigger**: `Login / Post Login`
4. Use the following code:
```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://qr-menu.example.com'; // Must be a URL, but doesn't have to exist
  if (event.authorization) {
    api.accessToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
    api.idToken.setCustomClaim(`${namespace}/roles`, event.authorization.roles);
  }
};
```
5. Click **Deploy**.
6. Navigate to **Actions -> Flows**, select **Login**, and drag your new Action into the flow between Start and Complete. Click **Apply**.

## 5. Create the Frontend Application
1. Navigate to **Applications -> Applications**.
2. Click **Create Application** and choose **Single Page Web Applications**.
3. **Name**: `QR Menu Dashboard UI`
4. Go to **Settings**:
   - **Allowed Callback URLs**: `http://localhost:5173, https://your-production-url.com`
   - **Allowed Logout URLs**: `http://localhost:5173, https://your-production-url.com`
   - **Allowed Web Origins**: `http://localhost:5173, https://your-production-url.com`
5. Save the Settings. 
6. Grab the **Domain** and **Client ID** to place in your `apps/dashboard-ui/.env` file:
   ```env
   VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
   VITE_AUTH0_CLIENT_ID=your_client_id
   VITE_AUTH0_AUDIENCE=https://api.qr-menu.example.com
   ```
