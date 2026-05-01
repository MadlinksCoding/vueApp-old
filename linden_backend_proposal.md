# Backend Structural Proposal: Querying Orders by Product Owner

## Current Challenge
An order can contain multiple products, and those products might belong to different owners (creators). We need the ability to efficiently query all orders that contain at least one product belonging to a specific `owner_id` (Creator), **without** performing full database scans.

If we simply store `product_owner_ids: ["creator_1", "creator_2"]` as a list inside the parent Order JSON, querying it efficiently at scale is difficult in NoSQL (like DynamoDB) because Global Secondary Indexes (GSIs) do not natively index individual elements of an array. 

## Proposed Architecture for Efficient Querying

To achieve highly performant "Orders Received" filtering for creators, we need a structural change depending on your underlying database architecture. 

### Approach A: Single-Table NoSQL (DynamoDB / MongoDB) - "Fan-Out Pattern"
Instead of relying on a single Order record, we implement a "Fan-Out" pattern where we write the Order data and explicitly link it to the creator.

1. **Primary Order Item**: 
   - `PK`: `ORDER#<order_id>`
   - `SK`: `META`
   - Data: Full order details, total, customer info.

2. **Order-Creator Index Items (The Fix)**:
   For every unique creator whose product is in the order, write an additional item in the database during checkout:
   - `PK`: `CREATOR#<owner_id>`
   - `SK`: `ORDER#<order_id>`
   - Data: Can include a subset of order data (timestamp, status) or the full order snapshot.

**How to query:** 
To get all orders for a specific creator, you simply query `PK = CREATOR#<owner_id> AND SK begins_with(ORDER#)`. This is a direct O(1) Index lookup. No array scanning needed.

### Approach B: Relational DB (SQL / Postgres / MySQL) - "Junction Table"
If using a relational database, you avoid scanning JSON/Array columns by utilizing a normalized Many-to-Many junction table.

1. **Orders Table**: Contains `order_id`, `customer_id`, `total`, `status`.
2. **Order_Products Table**: Links `order_id` -> `product_id`.
3. **Order_Creators (Junction) Table (The Fix)**:
   - `order_id` (Foreign Key)
   - `owner_id` (Foreign Key - Creator)
   - `created_at` (For sorting)

**How to query:**
When the creator views "Orders Received", you execute:
```sql
SELECT orders.* FROM orders 
JOIN order_creators ON orders.order_id = order_creators.order_id 
WHERE order_creators.owner_id = 'creator_123' 
ORDER BY order_creators.created_at DESC;
```
This query instantly utilizes a B-Tree index on `owner_id`, eliminating full table scans.

## Conclusion
To make the API fast and robust for the dashboard:
1. Do not use `.scan()` or full table array lookups.
2. Adopt the **Fan-Out technique (for NoSQL)** or a **Junction Index Table (for SQL)**.
3. The frontend `fetchOrdersFlow` is already sending `ownerId` as a query parameter (e.g. `?ownerId=creator_1`). Once the backend adopts this index structure, it can instantly resolve this parameter.
