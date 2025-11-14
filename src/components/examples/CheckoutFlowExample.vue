<template>
  <div class="page stack" data-component-path="examples/CheckoutFlowExample.vue">
    <!-- HEADER / STATUS -->
    <div class="card row" style="align-items:center;">
      <h2 style="margin:0;">Checkout Flow Example</h2>

      <span class="badge">Step: {{ checkout.step }}</span>
      <span class="badge">Sub: {{ checkout.substep || '—' }}</span>
      <span class="badge">
        Mode: {{ checkout.state.payment.mode || 'none' }}
      </span>

      <span style="margin-left:auto;" class="row">
        <button class="btn small" @click="checkout.forceStep(1)">1</button>
        <button class="btn small" @click="checkout.forceStep(2)">2</button>
        <button class="btn small" @click="checkout.forceStep(3)">3</button>
        <button class="btn small" @click="checkout.forceStep(4)">4</button>
        <button class="btn small primary" @click="checkout.forceStep(5)">5</button>
        <button class="btn small" @click="checkout.initializeFromState()">
          initFromState
        </button>
      </span>
    </div>

    <!-- STEP 1: CART -->
    <div
      v-if="checkout.step === 1"
      class="card stack"
      data-component-path="examples/CheckoutFlowExample.vue:Step1Cart"
    >
      <h3>Step 1 — Cart</h3>

      <table class="cart-table">
        <thead>
          <tr>
            <th style="text-align:left;">Item</th>
            <th style="text-align:right;">Qty</th>
            <th style="text-align:right;">Price</th>
            <th style="text-align:right;">Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(line, idx) in checkout.state.cart.lines" :key="line.id">
            <td>{{ line.name }}</td>
            <td style="text-align:right;">
              <input
                type="number"
                min="1"
                :value="line.qty"
                @input="updateQty(idx, $event.target.value)"
                style="width:3rem;"
              />
            </td>
            <td style="text-align:right;">{{ line.price.toFixed(2) }}</td>
            <td style="text-align:right;">
              {{ (line.price * line.qty).toFixed(2) }}
            </td>
            <td>
              <button class="btn small danger" @click="removeLine(idx)">
                ×
              </button>
            </td>
          </tr>
          <tr v-if="checkout.state.cart.lines.length === 0">
            <td colspan="5" class="muted">
              Cart is empty (demo). Click "fill demo cart".
            </td>
          </tr>
        </tbody>
      </table>

      <div class="row" style="justify-content:space-between;align-items:center;">
        <div class="row">
          <button class="btn small" @click="fillDemoCart">Fill demo cart</button>
          <button class="btn small" @click="clearCart">Clear cart</button>
        </div>
        <div class="row" style="align-items:center;">
          <b>Subtotal:</b>
          <span>\${{ cartSubtotal.toFixed(2) }}</span>
        </div>
      </div>

      <div class="row">
        <button
          class="btn primary"
          @click="checkout.goToStep(2, { intent: 'user' })"
          :disabled="checkout.state.cart.lines.length === 0"
        >
          Next → Shipping
        </button>
      </div>

      <small class="muted">
        Exit Step 1 validator (in real-world) would ensure non-empty cart,
        valid stock, etc.
      </small>
    </div>

    <!-- STEP 2: SHIPPING ADDRESS -->
    <div
      v-else-if="checkout.step === 2"
      class="card stack"
      data-component-path="examples/CheckoutFlowExample.vue:Step2Shipping"
    >
      <h3>Step 2 — Shipping address</h3>

      <div class="stack">
        <label>Full name</label>
        <input
          type="text"
          :value="checkout.state.shipping.fullName"
          @input="checkout.setState('shipping.fullName', $event.target.value, { reason: 'user:ship:name' })"
        />
      </div>

      <div class="stack">
        <label>Address line 1</label>
        <input
          type="text"
          :value="checkout.state.shipping.line1"
          @input="checkout.setState('shipping.line1', $event.target.value, { reason: 'user:ship:line1' })"
        />
      </div>

      <div class="stack">
        <label>City</label>
        <input
          type="text"
          :value="checkout.state.shipping.city"
          @input="checkout.setState('shipping.city', $event.target.value, { reason: 'user:ship:city' })"
        />
      </div>

      <div class="stack">
        <label>Postcode</label>
        <input
          type="text"
          :value="checkout.state.shipping.postcode"
          @input="checkout.setState('shipping.postcode', $event.target.value, { reason: 'user:ship:postcode' })"
        />
      </div>

      <div class="stack">
        <label>Country</label>
        <select
          :value="checkout.state.shipping.country"
          @change="checkout.setState('shipping.country', $event.target.value, { reason: 'user:ship:country' })"
        >
          <option value="">Select…</option>
          <option>Australia</option>
          <option>New Zealand</option>
          <option>USA</option>
          <option>UK</option>
        </select>
      </div>

      <div class="row">
        <button class="btn" @click="checkout.goToStep(1, { intent: 'user' })">← Back</button>
        <button class="btn primary" @click="checkout.goToStep(3, { intent: 'user' })">
          Next → Delivery
        </button>
      </div>

      <small class="muted">
        Exit Step 2 validator could ensure required fields, valid postcode by API,
        or external shipping rules.
      </small>
    </div>

    <!-- STEP 3: DELIVERY OPTIONS (substeps) -->
    <div
      v-else-if="checkout.step === 3"
      class="card stack"
      data-component-path="examples/CheckoutFlowExample.vue:Step3Delivery"
    >
      <h3>Step 3 — Delivery options</h3>

      <!-- Substep tabs: method / window -->
      <div class="row tabs small">
        <button
          class="btn"
          :class="{ active: checkout.substep === 'method' || !checkout.substep }"
          @click="checkout.goToSubstep('method', { intent: 'user' })"
        >
          Method
        </button>
        <button
          class="btn"
          :class="{ active: checkout.substep === 'window' }"
          @click="checkout.goToSubstep('window', { intent: 'user' })"
        >
          Delivery window
        </button>
        <button
          class="btn"
          :class="{ active: checkout.substep === 'summary' }"
          @click="checkout.goToSubstep('summary', { intent: 'user' })"
        >
          Summary
        </button>
      </div>

      <!-- Substep: method -->
      <section v-if="!checkout.substep || checkout.substep === 'method'" class="stack">
        <h4>Choose a delivery method</h4>

        <label class="row between">
          <span>
            <input
              type="radio"
              name="deliveryMethod"
              value="standard"
              :checked="checkout.state.delivery.method === 'standard'"
              @change="checkout.setState('delivery.method', 'standard', { reason: 'user:delivery:method' })"
            />
            Standard (3–5 days)
          </span>
          <span>\$10.00</span>
        </label>

        <label class="row between">
          <span>
            <input
              type="radio"
              name="deliveryMethod"
              value="express"
              :checked="checkout.state.delivery.method === 'express'"
              @change="checkout.setState('delivery.method', 'express', { reason: 'user:delivery:method' })"
            />
            Express (1–2 days)
          </span>
          <span>\$20.00</span>
        </label>

        <label class="row between">
          <span>
            <input
              type="radio"
              name="deliveryMethod"
              value="pickup"
              :checked="checkout.state.delivery.method === 'pickup'"
              @change="checkout.setState('delivery.method', 'pickup', { reason: 'user:delivery:method' })"
            />
            Click & Collect
          </span>
          <span>\$0.00</span>
        </label>
      </section>

      <!-- Substep: window -->
      <section v-else-if="checkout.substep === 'window'" class="stack">
        <h4>Choose a delivery window</h4>

        <select
          :value="checkout.state.delivery.window"
          @change="checkout.setState('delivery.window', $event.target.value, { reason: 'user:delivery:window' })"
        >
          <option value="">Select window…</option>
          <option value="weekday_am">Weekday AM (8–12)</option>
          <option value="weekday_pm">Weekday PM (12–17)</option>
          <option value="saturday">Saturday</option>
        </select>

        <small class="muted">
          You could use external service (carrier API) to validate time windows.
        </small>
      </section>

      <!-- Substep: summary -->
      <section v-else-if="checkout.substep === 'summary'" class="stack">
        <h4>Delivery summary</h4>
        <pre class="log">{{ pretty(checkout.state.delivery) }}</pre>
      </section>

      <div class="row">
        <button class="btn" @click="checkout.goToStep(2, { intent: 'user' })">← Back</button>
        <button class="btn primary" @click="checkout.goToStep(4, { intent: 'user' })">
          Next → Payment
        </button>
      </div>

      <small class="muted">
        Validators for Step 3 can require both delivery.method and delivery.window before
        allowing Step 4.
      </small>
    </div>

    <!-- STEP 4: PAYMENT (with async-like validator stub) -->
    <div
      v-else-if="checkout.step === 4"
      class="card stack"
      data-component-path="examples/CheckoutFlowExample.vue:Step4Payment"
    >
      <h3>Step 4 — Payment</h3>

      <div class="row tabs small">
        <button
          class="btn"
          :class="{ active: checkout.state.payment.mode === 'card' }"
          @click="choosePayment('card')"
        >
          Card
        </button>
        <button
          class="btn"
          :class="{ active: checkout.state.payment.mode === 'paypal' }"
          @click="choosePayment('paypal')"
        >
          PayPal
        </button>
        <button
          class="btn"
          :class="{ active: checkout.state.payment.mode === 'afterpay' }"
          @click="choosePayment('afterpay')"
        >
          Afterpay
        </button>
      </div>

      <!-- Payment form switches based on mode -->
      <section v-if="checkout.state.payment.mode === 'card'" class="stack">
        <label>Card number</label>
        <input
          type="text"
          :value="checkout.state.payment.card.number"
          @input="checkout.setState('payment.card.number', $event.target.value, { reason: 'user:card:number' })"
        />

        <label>Expiry (MM/YY)</label>
        <input
          type="text"
          :value="checkout.state.payment.card.expiry"
          @input="checkout.setState('payment.card.expiry', $event.target.value, { reason: 'user:card:expiry' })"
        />

        <label>CVC</label>
        <input
          type="text"
          :value="checkout.state.payment.card.cvc"
          @input="checkout.setState('payment.card.cvc', $event.target.value, { reason: 'user:card:cvc' })"
        />
      </section>

      <section v-else-if="checkout.state.payment.mode === 'paypal'" class="stack">
        <p>PayPal selected. In a real app, this would trigger an external redirect or popup.</p>
        <label>PayPal email</label>
        <input
          type="email"
          :value="checkout.state.payment.paypalEmail"
          @input="checkout.setState('payment.paypalEmail', $event.target.value, { reason: 'user:pp:email' })"
        />
      </section>

      <section v-else-if="checkout.state.payment.mode === 'afterpay'" class="stack">
        <p>Afterpay selected (demo only).</p>
        <p class="muted">
          Real logic would involve external Afterpay SDK.
        </p>
      </section>

      <section v-else class="stack">
        <p class="muted">Choose a payment method to continue.</p>
      </section>

      <div class="row">
        <button class="btn" @click="checkout.goToStep(3, { intent: 'user' })">← Back</button>
        <!-- We still call goToStep — a real async validator would run inside engine -->
        <button
          class="btn primary"
          @click="checkout.goToStep(5, { intent: 'user' })"
          :disabled="!isPaymentFormBasicValid"
        >
          Next → Review & Confirm
        </button>
      </div>

      <small class="muted">
        Async validations (card tokenization, payment intent creation, etc.) would run as
        engine validators or inside this step before calling goToStep(5).
      </small>
    </div>

    <!-- STEP 5: REVIEW & CONFIRM -->
    <div
      v-else-if="checkout.step === 5"
      class="card stack"
      data-component-path="examples/CheckoutFlowExample.vue:Step5Review"
    >
      <h3>Step 5 — Review & Confirm</h3>

      <div class="row">
        <div class="card stack" style="flex:1;">
          <b>Cart</b>
          <pre class="log">{{ pretty(checkout.state.cart) }}</pre>
        </div>
        <div class="card stack" style="flex:1;">
          <b>Shipping & Delivery</b>
          <pre class="log">{{ pretty({ shipping: checkout.state.shipping, delivery: checkout.state.delivery }) }}</pre>
        </div>
      </div>

      <div class="card stack">
        <b>Payment</b>
        <pre class="log">{{ pretty(checkout.state.payment) }}</pre>
      </div>

      <div class="row">
        <button class="btn" @click="checkout.goToStep(4, { intent: 'user' })">
          ← Back
        </button>
        <button class="btn ok" @click="confirmOrder">
          Confirm order
        </button>
      </div>
    </div>

    <!-- FALLBACK -->
    <div v-else class="card stack">
      <h3>Unknown step {{ checkout.step }}</h3>
      <button class="btn" @click="checkout.forceStep(1)">Reset to 1</button>
    </div>

    <!-- DEBUG: LOGS -->
    <div class="card stack" style="margin-top:1rem;">
      <div class="row">
        <b>Checkout Engine Logs (tail)</b>
        <span class="badge">{{ checkout.logs.length }}</span>
      </div>
      <pre class="log">{{ tail(checkout.logs, 120).join('\n') }}</pre>
    </div>
  </div>
</template>

<script>
import { computed, onMounted } from 'vue';
import {
    createStepStateEngine,
    attachEngineLogging
} from '@/utils/stateEngine';

export default
{
    name: 'CheckoutFlowExample',

    setup()
    {
        const checkout = createStepStateEngine(
            {
                flowId: 'checkoutDemo',
                urlSync: 'query',
                initialStep: 1,
                forcePolicy: 'log',
                defaults:
                {
                    cart:
                    {
                        lines: []
                    },
                    shipping:
                    {
                        fullName: '',
                        line1: '',
                        city: '',
                        postcode: '',
                        country: ''
                    },
                    delivery:
                    {
                        method: '',
                        window: ''
                    },
                    payment:
                    {
                        mode: '', // 'card' | 'paypal' | 'afterpay'
                        card:
                        {
                            number: '',
                            expiry: '',
                            cvc: ''
                        },
                        paypalEmail: ''
                    }
                }
            }
        );

        attachEngineLogging(checkout);

        onMounted(
            () =>
            {
                checkout.initialize(
                    {
                        fromUrl: true
                    }
                );
            }
        );

        // -------------------------
        // CART HELPERS
        // -------------------------
        const cartSubtotal = computed(
            () =>
            {
                return (checkout.state.cart.lines || []).reduce(
                    (sum, line) =>
                        sum + (line.price || 0) * (line.qty || 0),
                    0
                );
            }
        );

        function fillDemoCart()
        {
            checkout.setState(
                'cart.lines',
                [
                    {
                        id: 'sku-1',
                        name: 'Red T-Shirt',
                        qty: 2,
                        price: 29.99
                    },
                    {
                        id: 'sku-2',
                        name: 'Blue Jeans',
                        qty: 1,
                        price: 79.5
                    }
                ],
                {
                    reason: 'demo:cart:fill'
                }
            );
        }

        function clearCart()
        {
            checkout.setState(
                'cart.lines',
                [],
                {
                    reason: 'user:cart:clear'
                }
            );
        }

        function updateQty(index, newValue)
        {
            const qty = Math.max(1, Number(newValue) || 1);
            const lines = (checkout.state.cart.lines || []).slice();

            if (!lines[index])
            {
                return;
            }

            lines[index] =
            {
                ...lines[index],
                qty
            };

            checkout.setState(
                'cart.lines',
                lines,
                {
                    reason: 'user:cart:updateQty'
                }
            );
        }

        function removeLine(index)
        {
            const lines = (checkout.state.cart.lines || []).slice();

            lines.splice(index, 1);

            checkout.setState(
                'cart.lines',
                lines,
                {
                    reason: 'user:cart:removeLine'
                }
            );
        }

        // -------------------------
        // PAYMENT HELPERS
        // -------------------------

        function choosePayment(mode)
        {
            checkout.setState(
                'payment.mode',
                mode,
                {
                    reason: 'user:payment:mode'
                }
            );
        }

        const isPaymentFormBasicValid = computed(
            () =>
            {
                const mode = checkout.state.payment.mode;

                if (!mode)
                {
                    return false;
                }

                if (mode === 'card')
                {
                    const { number, expiry, cvc } = checkout.state.payment.card;
                    return Boolean(number && expiry && cvc);
                }

                if (mode === 'paypal')
                {
                    const email = (checkout.state.payment.paypalEmail || '').trim();
                    return email.includes('@') && email.includes('.');
                }

                if (mode === 'afterpay')
                {
                    return true; // pretend external widget handles it
                }

                return false;
            }
        );

        function confirmOrder()
        {
            const plainState = JSON.parse(JSON.stringify(checkout.state));
            console.log('[CheckoutFlowExample] confirmOrder payload',plainState );
            alert('Order confirmed (demo). See console for payload.');
        }

        // -------------------------
        // UTILS
        // -------------------------
        function pretty(value)
        {
            try
            {
                return JSON.stringify(value, null, 2);
            }
            catch (e)
            {
                return String(value);
            }
        }

        function tail(array, max)
        {
            if (!Array.isArray(array))
            {
                return [];
            }

            const start = Math.max(array.length - max, 0);
            return array.slice(start);
        }

        return {
            checkout,
            cartSubtotal,
            fillDemoCart,
            clearCart,
            updateQty,
            removeLine,
            choosePayment,
            isPaymentFormBasicValid,
            confirmOrder,
            pretty,
            tail
        };
    }
};
</script>

<style scoped>
.page {
  padding: 1rem;
  gap: 1rem;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.row {
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
}
.row.between {
  justify-content: space-between;
  align-items: center;
}
.card {
  border: 1px solid #ddd;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: #fff;
}
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  background: #eef2ff;
  font-size: 0.75rem;
}
.btn {
  border-radius: 999px;
  border: 1px solid #ddd;
  padding: 0.3rem 0.7rem;
  background: #f5f5f5;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn.primary {
  background: #2563eb;
  color: white;
  border-color: #1d4ed8;
}
.btn.ok {
  background: #16a34a;
  color: white;
  border-color: #15803d;
}
.btn.small {
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
}
.btn.danger,
.btn.small.danger {
  background: #ef4444;
  color: white;
  border-color: #b91c1c;
}
.btn.active {
  background: #111827;
  color: #f9fafb;
}
.tabs.small .btn {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}
.muted {
  font-size: 0.8rem;
  color: #6b7280;
}
.log {
  max-height: 220px;
  overflow: auto;
  background: #0b1020;
  color: #e5e7eb;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
}
.cart-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.cart-table th,
.cart-table td {
  border-bottom: 1px solid #e5e7eb;
  padding: 0.3rem 0.4rem;
}
</style>