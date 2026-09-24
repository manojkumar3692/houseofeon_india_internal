# RANK private pilot support

The reported RANK context503 was caused by the store's original Arctic-only
pilotCart guard throwing a plain error. All six live pricing rows were verified
correct (124900 regular/99900 selling), the catalog read succeeded for all six,
and the deployed connector rejected unsigned requests with401 as expected.
This was not a pricing migration or credential configuration failure.

The owner enabled RANK for testing. Store support now permits only Arctic Wave
and RANK, using exact product:50ml variant identities. Unsupported products or
mismatched variants return422. Signed context checks the requested product's DB
pricing and inventory. Checkout retains exact quote amounts, quantity1/prepaid,
expiry, reservation/retry protection and no coupon stacking.

The supplied widget host accepts only the two supported product IDs. Product
pages still require the existing widget flag/public key and a tab-held tester
token. EON validates private access, product scope, activation, rules, cooldown
and invitation signals. No ordinary shoppers are enabled. Checkout product
image and back links now come from the stored quote's actual product.

Owner deployment: deploy these store changes, then rerun EON's signed RANK
context/readiness test. Use the RANK-specific tester link only after approved
RANK economic rules and private activation pass. No new database migration,
credential rotation or environment variable is needed. Other products are not
enabled for negotiation by this update.

No production writes, app deployments, commits, pushes or payments were performed
by this task. Live RANK invitation/payment acceptance remains pending deployment.
