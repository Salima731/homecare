const Razorpay = require('razorpay');
require('dotenv').config();

const testRazorpay = async () => {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  console.log('Testing Razorpay with Key:', process.env.RAZORPAY_KEY_ID);

  try {
    const order = await razorpay.orders.create({
      amount: 100, // 1 INR
      currency: 'INR',
      receipt: 'test_receipt'
    });
    console.log('✅ Razorpay Connection Success! Order ID:', order.id);
  } catch (error) {
    console.error('❌ Razorpay Connection Failed:');
    console.error(JSON.stringify(error, null, 2));
  }
};

testRazorpay();
