# Security Specification - Aether Connect POS

## Data Invariants
1. A Shop must have a name, manager password, and staff password.
2. Orders, Products, and Customers must always belong to a valid Shop.
3. Once an Order is 'completed', it cannot be modified except for deletion by an Admin/Manager (if implemented).

## The Dirty Dozen Payloads (Negative Tests)
1. Creating a shop without a manager password.
2. Updating a shop's name without knowing the manager password (logic check).
3. Creating a product with a negative price.
4. Injecting a 1MB string as a product category.
5. Deleting an order from another shop by guessing the ID.
6. Creating an order with no items.
7. Changing the shop owner's password from a staff session.
8. Accessing customer PII (notes) without being logged into a shop.
9. Moving an order from 'pending' to 'completed' without a valid staff session.
10. Creating a shop with a reserved/poisoned ID.
11. Updating `createdAt` on an existing document.
12. Bulk reading all shops without a filter.

## Security Rules Implementation Strategy
- Use `isValidId` for all path variables.
- Use `isValidShop`, `isValidProduct`, `isValidOrder`, `isValidCustomer` helpers.
- Access control will be tied to the `shopId`.
- In a production app, we would use Firebase Auth. Here, we'll implement the schema validation and basic relational checks.
