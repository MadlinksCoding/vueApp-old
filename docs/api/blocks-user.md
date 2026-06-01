# Block User Service — Full CRUD Documentation

**Server:** `http://168.144.35.180:3000`  
**Database:** ScyllaDB (Live Production)  
**Status:** Active  

---

## Database Tables
All delete operations are **soft deletes** — records are not removed from the database. Instead, the `deleted_at` field is set to the current timestamp. This preserves audit history.

| Table | Purpose | Primary Key | Sort Key |
|-------|---------|-------------|----------|
| `user_blocks` | User-to-user blocks | `blocker_id` | `sk_scope` |
| `system_blocks` | IP, email, app blocks | `identifier` | `sk_type` |
| `manual_actions` | Suspensions, warnings | `user_id` | `sk_ts` |

---

## CREATE Endpoints

### 1. Block User
Blocks one user from interacting with another user within a specific scope.

**Request:** `POST /block-users/blockUser`  
**Content-Type:** `application/json`
```json
{
  "from": "user_A",
  "to": "user_B",
  "scope": "private_chat",
  "reason": "harassment",
  "is_permanent": true
}
```
**Parameters:**
- `from` (required) — User ID of the person creating the block
- `to` (required) — User ID of the person being blocked
- `scope` (required) — Where the block applies: `private_chat`, `call`, `purchase`, `feed`, `global`
- `reason` (optional) — Text description of why user was blocked
- `is_permanent` (optional) — `true` for permanent, `false` for temporary
- `expires_at` (optional) — Seconds until expiry (for temporary blocks)

**Response (201):**
```json
{
  "success": true,
  "result": true
}
```
*(Writes to `user_blocks` table)*

### 2. Block IP Address
Blocks an IP address from accessing the system.

**Request:** `POST /block-users/blockIP`  
**Content-Type:** `application/json`
```json
{
  "ip": "192.168.1.100",
  "reason": "suspicious activity",
  "permanent": true
}
```
**Response (200):**
```json
{
  "success": true
}
```
*(Writes to `system_blocks` table)*

### 3. Block Email
Blocks an email address from being used for registration or login.

**Request:** `POST /block-users/blockEmail`  
**Content-Type:** `application/json`
```json
{
  "email": "spam@example.com",
  "reason": "spam account",
  "permanent": true
}
```
*(Writes to `system_blocks` table — email is stored as SHA-256 hash)*

### 4. Block App Access
Blocks a user from accessing a specific part of the application.

**Request:** `POST /block-users/blockAppAccess`  
**Content-Type:** `application/json`
```json
{
  "userId": "user_A",
  "scope": "marketplace",
  "reason": "policy violation",
  "permanent": true
}
```
*(Writes to `system_blocks` table)*

### 5. Suspend User
Suspends a user account entirely. Admin action.

**Request:** `POST /block-users/suspendUser`  
**Content-Type:** `application/json`
```json
{
  "userId": "user_A",
  "reason": "repeated violations",
  "adminId": "admin_001",
  "flag": "severe",
  "note": "3rd offense"
}
```
*(Writes to `manual_actions` table)*

### 6. Warn User
Issues a warning to a user. Admin action.

**Request:** `POST /block-users/warnUser`  
**Content-Type:** `application/json`
```json
{
  "userId": "user_A",
  "flag": "language",
  "adminId": "admin_001",
  "note": "inappropriate language in chat"
}
```
*(Writes to `manual_actions` table)*

---

## READ Endpoints

### 7. Is User Blocked
Checks if a specific user is blocked by another user. Returns only true or false.

**Request:** `GET /block-users/isUserBlocked?from=user_A&to=user_B`
*Note: The `scope` parameter is optional. If omitted, the system checks ALL scopes. If provided, it checks only that specific scope (e.g. `&scope=private_chat`).*

**Response when blocked:**
```json
{
  "blocked": true
}
```
**Response when not blocked:**
```json
{
  "blocked": false
}
```

### 8. List User Blocks
Lists all user-to-user blocks with pagination and filtering.

**Request:** `GET /block-users/listUserBlocks?limit=20`
*Optional filters: `from`, `to`, `scope`, `is_permanent`, `flag`, `sort_by`, `sort_order`, `limit`, `nextToken`*

**Response:**
```json
{
  "items": [
    {
      "blocker_id": "user_A",
      "blocked_id": "user_B",
      "scope": "private_chat",
      "reason": "harassment",
      "is_permanent": 1,
      "created_at": 1779951866000
    }
  ],
  "count": 1,
  "nextToken": null
}
```

### 9. Get Blocks For User
Gets ALL block-related data for a specific user across all three tables.

**Request:** `GET /block-users/getBlocksForUser?to=user_B`

**Response:**
```json
{
  "count": 3,
  "blocks": {
    "user_blocks": [...],
    "system_blocks": [...],
    "manual_actions": [...]
  }
}
```

### 10. Is IP Blocked
Checks if an IP address is blocked.

**Request:** `GET /block-users/isIPBlocked?ip=192.168.1.100`

**Response:**
```json
{
  "blocked": true,
  "details": { "db": { ... } }
}
```

### 11. Is Email Blocked
Checks if an email address is blocked.

**Request:** `GET /block-users/isEmailBlocked?email=spam@example.com`

### 12. Is App Access Blocked
Checks if a user's app access is blocked for a specific scope.

**Request:** `GET /block-users/isAppAccessBlocked?userId=user_A&scope=marketplace`

### 13. List System Blocks
Lists all system-level blocks (IP, email, app access).

**Request:** `GET /block-users/listSystemBlocks?limit=20`

### 14. Is User Suspended
Checks if a user account is suspended.

**Request:** `GET /block-users/isUserSuspended?userId=user_A`

### 15. List Manual Actions
Lists all manual admin actions (suspensions, warnings).

**Request:** `GET /block-users/listManualActions?limit=20`

### 19. Get User Manual Actions
Gets all manual actions (suspensions, warnings) for a specific user.

**Request:** `GET /block-users/getUserManualActions?userId=user_A`

---

## DELETE Endpoints

### 16. Unblock User
Removes a block between two users. This is a soft delete — the record stays in the database but `deleted_at` is set to the current timestamp.

**Request:** `POST /block-users/unblockUser`  
**Content-Type:** `application/json`
```json
{
  "from": "user_A",
  "to": "user_B",
  "scope": "private_chat"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "blocker_id": "user_A",
    "blocked_id": "user_B",
    "scope": "private_chat",
    "deleted_at": 1779951907000
  }
}
```

### 17. Unsuspend User
Removes a suspension from a user account.

**Request:** `POST /block-users/unsuspendUser`  
**Content-Type:** `application/json`
```json
{
  "userId": "user_A"
}
```

---

## BATCH / UTILITY Endpoints

### 18. Batch Check User Blocks
Check multiple user block relationships in one request.

**Request:** `POST /block-users/batchCheckUserBlocks`  
**Content-Type:** `application/json`
```json
{
  "blocks": [
    { "from": "user_A", "to": "user_B", "scope": "private_chat" },
    { "from": "user_C", "to": "user_D", "scope": "feed" }
  ]
}
```

**Response:**
```json
{
  "results": [
    { "from": "user_A", "to": "user_B", "scope": "private_chat", "blocked": true },
    { "from": "user_C", "to": "user_D", "scope": "feed", "blocked": false }
  ]
}
```

### 20. User Activity Stats (Risk Score)
Calculates a risk score for a user based on all their blocks, suspensions, and warnings.

**Request:** `POST /block-users/UserStats`  
**Content-Type:** `application/json`
```json
{
  "userId": "user_A"
}
```

**Response:**
```json
{
  "blockScores": {
    "userBlocks": { 
      "private_chat": { "active": 10, "expired": 5 }
    },
    "systemBlocks": { 
      "app": { "active": 0, "expired": 0 } 
    },
    "manualActions": { 
      "warning": { "active": 5, "expired": 0 }, 
      "suspension": { "active": 0, "expired": 0 } 
    }
  },
  "totalScore": 20,
  "threshold": 500,
  "flagged": false
}
```
