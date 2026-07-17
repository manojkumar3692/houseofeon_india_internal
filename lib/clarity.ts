type ClarityWindow = Window & {
    clarity?: (...args: any[]) => void;
  };
  
  export function trackClarityEvent(eventName: string) {
    if (typeof window === "undefined") return;
  
    const clarity = (window as ClarityWindow).clarity;
  
    if (!clarity) return;
  
    clarity("event", eventName);
  }
  
  export function trackProductViewed(productName: string) {
    trackClarityEvent(`Product Viewed - ${productName}`);
  }
  
  export function trackAddToCartClarity(productName: string) {
    trackClarityEvent(`Add To Cart - ${productName}`);
  }
  
  export function trackCouponAppliedClarity(couponCode: string) {
    trackClarityEvent(`Coupon Applied - ${couponCode}`);
  }
  
  export function trackCheckoutStartedClarity() {
    trackClarityEvent("Checkout Started");
  }
  
  export function trackPaymentSuccessClarity() {
    trackClarityEvent("Payment Success");
  }