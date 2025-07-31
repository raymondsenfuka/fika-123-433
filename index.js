const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Cloud Function to calculate fare when a new booking is created
exports.calculateFareOnCreate = functions.firestore
  .document('bookings/{bookingId}')
  .onCreate(async (snap, context) => {
    const bookingData = snap.data();
    const bookingId = context.params.bookingId;

    // IMPORTANT: In your HTML, you send 'weight', 'pickupLat', 'pickupLng', 'dropoffLat', 'dropoffLng' as strings.
    // Ensure these are parsed as numbers for calculations.
    const parcelWeight = parseFloat(bookingData.weight) || 0; // Use 'weight' directly from bookingData
    const pickupOption = bookingData.pickupOption; // 'custom', 'mpigi', 'kampala'
    const dropoffOption = bookingData.dropoffOption; // 'custom', 'mpigi', 'kampala'

    let calculatedFare = 0;

    // --- Implement your fare logic here ---
    // This logic should match your business rules and ideally use real distance calculations
    // via a mapping API (like Google Maps Distance Matrix API) for accuracy.

    if (pickupOption === 'custom' && dropoffOption === 'custom') {
        // Direct delivery fare logic (example)
        const pickupLat = parseFloat(bookingData.pickupLat);
        const pickupLng = parseFloat(bookingData.pickupLng);
        const dropoffLat = parseFloat(bookingData.dropoffLat);
        const dropoffLng = parseFloat(bookingData.dropoffLng);

        if (!isNaN(pickupLat) && !isNaN(pickupLng) && !isNaN(dropoffLat) && !isNaN(dropoffLng)) {
            // Placeholder: In a real app, calculate actual distance using a mapping API
            // For example, using Google Maps Distance Matrix API:
            // const distanceResponse = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pickupLat},${pickupLng}&destinations=${dropoffLat},${dropoffLng}&key=YOUR_Maps_API_KEY`);
            // const distance = distanceResponse.data.rows[0].elements[0].distance.value / 1000; // in km

            const dummyDistance = 15; // Example: Assuming 15km for calculation
            calculatedFare = (dummyDistance * 1000) + (parcelWeight * 500); // e.g., UGX 1000/km + UGX 500/kg
        }
    } else {
        // Fare for collection point based deliveries (example)
        // You might have different tiers or fixed prices for Fika Centers
        if (parcelWeight <= 5) {
            calculatedFare = 7000; // Base fare for small parcels to/from Fika Centers
        } else if (parcelWeight <= 15) {
            calculatedFare = 12000; // Medium parcels
        } else {
            calculatedFare = 15000 + (parcelWeight - 15) * 200; // Large parcels + extra per kg
        }
    }

    const bookingFee = calculatedFare * 0.1; // 10% booking fee
    const totalAmount = calculatedFare + bookingFee;

    // Update the booking document with the calculated fare
    try {
      await admin.firestore().doc(`bookings/${bookingId}`).update({
        fareAmount: calculatedFare,
        bookingFee: bookingFee,
        totalAmount: totalAmount,
        fareCalculatedBy: 'backend', // Indicates fare was calculated by backend
        // You might also update the status to 'Fare Calculated' or similar here
      });
      console.log(`Fare calculated and updated for booking ${bookingId}: UGX ${totalAmount}`);
    } catch (error) {
      console.error(`Error updating fare for booking ${bookingId}:`, error);
    }

    return null; // Cloud Functions must return null, undefined, or a Promise
  });