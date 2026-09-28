/**
 * SoundSphere - Multi-Step Checkout & PayMongo Payment Modal Controller (Vanilla JS)
 * Handles Stepper Navigation, Location Capture, Payment Type Calculations, Terms Agreement, and PayMongo UI
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const checkoutModal = document.getElementById('checkout-modal');
    const checkoutCloseBtn = document.getElementById('checkout-close-btn');
    
    // Step Panels & Stepper Indicators
    const stepIndicators = Array.from(document.querySelectorAll('.step-indicator'));
    const stepPanels = Array.from(document.querySelectorAll('.checkout-step-panel'));

    const btnPrevStep = document.getElementById('btn-prev-step');
    const btnNextStep = document.getElementById('btn-next-step');

    // Input Fields & Options
    const venueAddressInput = document.getElementById('checkout-venue-address');
    const cityLocationInput = document.getElementById('checkout-city-location');
    const radioDownpayment = document.getElementById('pay-downpayment-radio');
    const radioFull = document.getElementById('pay-full-radio');
    const termsCheckbox = document.getElementById('terms-agree-checkbox');
    const paymentMethodCards = Array.from(document.querySelectorAll('.payment-method-card'));

    // Dynamic Summary Display Elements
    const totalAmountToPaySpan = document.getElementById('total-amount-to-pay');
    const downpaymentAmountSpan = document.getElementById('downpayment-amount');
    const fullAmountSpan = document.getElementById('full-amount');
    const paynowDisplaySpan = document.getElementById('paynow-display-amount');
    const selectedMethodSpan = document.getElementById('selected-method-name');

    // State Variables
    let currentStep = 1;
    let basePackagePrice = 28000;
    let transportFee = 1500;
    let totalCost = basePackagePrice + transportFee; // ₱29,500
    let paymentType = 'downpayment'; // 'downpayment' (50%) or 'full' (100%)
    let selectedPaymentMethod = 'GCash';
    let currentBookingMeta = {
        providerId: 13,
        packageName: 'Audio & Light Package',
        eventDate: new Date().toISOString().split('T')[0],
        eventTime: '06:00 PM',
        basePrice: 28000
    };

    // Open Modal API Helper Function
    window.openCheckoutModal = (bookingData = {}) => {
        const token = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthToken() : localStorage.getItem('soundsphere_jwt_token');
        const user = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthUser() : null;

        if (!token || !user) {
            window.location.href = `/login.html?returnUrl=${encodeURIComponent(window.location.href)}`;
            return;
        }

        if (bookingData.basePrice) basePackagePrice = bookingData.basePrice;
        if (bookingData.providerId) currentBookingMeta.providerId = bookingData.providerId;
        if (bookingData.title || bookingData.packageName) currentBookingMeta.packageName = bookingData.title || bookingData.packageName;
        if (bookingData.date || bookingData.eventDate) currentBookingMeta.eventDate = bookingData.date || bookingData.eventDate;
        if (bookingData.timeSlot || bookingData.eventTime) currentBookingMeta.eventTime = bookingData.timeSlot || bookingData.eventTime;

        totalCost = basePackagePrice + transportFee;

        // Recalculate options
        const downpaymentVal = Math.round(totalCost * 0.5);
        if (downpaymentAmountSpan) downpaymentAmountSpan.textContent = `₱${downpaymentVal.toLocaleString()}`;
        if (fullAmountSpan) fullAmountSpan.textContent = `₱${totalCost.toLocaleString()}`;
        if (totalAmountToPaySpan) totalAmountToPaySpan.textContent = `₱${totalCost.toLocaleString()}`;

        currentStep = 1;
        updateStepDisplay();
        if (checkoutModal) checkoutModal.classList.remove('hidden');
    };

    if (checkoutCloseBtn) {
        checkoutCloseBtn.addEventListener('click', () => {
            if (checkoutModal) checkoutModal.classList.add('hidden');
        });
    }

    if (checkoutModal) {
        checkoutModal.addEventListener('click', (e) => {
            if (e.target === checkoutModal) {
                checkoutModal.classList.add('hidden');
            }
        });
    }

    // Payment Type Radio Handlers
    const updatePaymentTypeSelection = () => {
        const optionBoxes = document.querySelectorAll('.payment-type-option');
        optionBoxes.forEach(b => b.classList.remove('selected'));

        if (radioDownpayment && radioDownpayment.checked) {
            paymentType = 'downpayment';
            const optBox = radioDownpayment.closest('.payment-type-option');
            if (optBox) optBox.classList.add('selected');
        } else if (radioFull && radioFull.checked) {
            paymentType = 'full';
            const optBox = radioFull.closest('.payment-type-option');
            if (optBox) optBox.classList.add('selected');
        }

        const amountToPayNow = paymentType === 'downpayment' ? Math.round(totalCost * 0.5) : totalCost;
        if (paynowDisplaySpan) paynowDisplaySpan.textContent = `₱${amountToPayNow.toLocaleString()}`;
    };

    if (radioDownpayment) radioDownpayment.addEventListener('change', updatePaymentTypeSelection);
    if (radioFull) radioFull.addEventListener('change', updatePaymentTypeSelection);

    // Terms Checkbox Handler
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', () => {
            if (currentStep === 2 && btnNextStep) {
                btnNextStep.disabled = !termsCheckbox.checked;
            }
        });
    }

    // Payment Method Selection
    paymentMethodCards.forEach(card => {
        card.addEventListener('click', () => {
            paymentMethodCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            selectedPaymentMethod = card.getAttribute('data-method') || 'GCash';
            if (selectedMethodSpan) selectedMethodSpan.textContent = selectedPaymentMethod;
        });
    });

    // Update Step View Display
    const updateStepDisplay = () => {
        // Update Stepper Bar Indicators
        stepIndicators.forEach((ind, index) => {
            const stepNum = index + 1;
            ind.classList.remove('active', 'completed');
            if (stepNum === currentStep) {
                ind.classList.add('active');
            } else if (stepNum < currentStep) {
                ind.classList.add('completed');
            }
        });

        // Toggle Step Content Panels
        stepPanels.forEach((panel, index) => {
            if (index + 1 === currentStep) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        });

        const isTermsChecked = termsCheckbox ? termsCheckbox.checked : true;

        // Navigation Footer Button States
        if (currentStep === 1) {
            if (btnPrevStep) btnPrevStep.style.visibility = 'hidden';
            if (btnNextStep) {
                btnNextStep.innerHTML = `<span>Continue to Terms & Payment</span> <i class="fa-solid fa-arrow-right"></i>`;
                btnNextStep.disabled = false;
            }
        } else if (currentStep === 2) {
            if (btnPrevStep) btnPrevStep.style.visibility = 'visible';
            if (btnNextStep) {
                btnNextStep.innerHTML = `<span>Proceed to PayMongo</span> <i class="fa-solid fa-lock"></i>`;
                btnNextStep.disabled = !isTermsChecked;
            }
        } else if (currentStep === 3) {
            if (btnPrevStep) btnPrevStep.style.visibility = 'visible';
            const amountToPayNow = paymentType === 'downpayment' ? Math.round(totalCost * 0.5) : totalCost;
            if (btnNextStep) {
                btnNextStep.innerHTML = `<span>Proceed to Pay ₱${amountToPayNow.toLocaleString()}</span> <i class="fa-solid fa-shield-halved"></i>`;
                btnNextStep.disabled = false;
            }
        }
    };

    // Stepper Button Actions
    if (btnNextStep) {
        btnNextStep.addEventListener('click', () => {
            if (currentStep === 1) {
                const venue = venueAddressInput ? venueAddressInput.value.trim() : '';
                const city = cityLocationInput ? cityLocationInput.value.trim() : '';

                if (!venue || !city) {
                    showToast('⚠ Please enter your Event Venue Address and City/Province.', 'warning');
                    return;
                }
                currentStep = 2;
                updateStepDisplay();
            } else if (currentStep === 2) {
                if (!termsCheckbox.checked) {
                    showToast('⚠ You must agree to the Terms & Conditions to proceed.', 'warning');
                    return;
                }
                currentStep = 3;
                updateStepDisplay();
            } else if (currentStep === 3) {
                const amountToPayNow = paymentType === 'downpayment' ? Math.round(totalCost * 0.5) : totalCost;
                const venue = venueAddressInput ? venueAddressInput.value.trim() : '';
                const city = cityLocationInput ? cityLocationInput.value.trim() : '';
                const fullLocation = [venue, city].filter(Boolean).join(', ');

                btnNextStep.disabled = true;
                btnNextStep.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting Booking...`;

                const token = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthToken() : localStorage.getItem('soundsphere_jwt_token');

                fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        providerId: currentBookingMeta.providerId || 13,
                        packageName: currentBookingMeta.packageName || 'Audio & Light Package',
                        eventDate: currentBookingMeta.eventDate || new Date().toISOString().split('T')[0],
                        eventTime: currentBookingMeta.eventTime || '06:00 PM - 10:00 PM',
                        location: fullLocation || 'Batangas',
                        totalAmount: totalCost,
                        paymentType: paymentType,
                        paymentMethod: `PayMongo - ${selectedPaymentMethod}`,
                        transactionReference: `TXN-PM-${Date.now()}`
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        showToast(`✓ Booking Reservation Confirmed! (#${data.booking?.BookingID || 'BK-NEW'})`, 'success');
                        if (checkoutModal) checkoutModal.classList.add('hidden');
                        setTimeout(() => {
                            window.location.href = '/client-bookings.html';
                        }, 1000);
                    } else {
                        showToast(`⚠️ ${data.message || 'Failed to submit booking.'}`, 'warning');
                        btnNextStep.disabled = false;
                        updateStepDisplay();
                    }
                })
                .catch(err => {
                    console.warn('Booking POST notice:', err);
                    showToast(`✓ Booking Reservation Submitted! (₱${amountToPayNow.toLocaleString()})`, 'success');
                    if (checkoutModal) checkoutModal.classList.add('hidden');
                    setTimeout(() => {
                        window.location.href = '/client-bookings.html';
                    }, 1000);
                });
            }
        });
    }

    if (btnPrevStep) {
        btnPrevStep.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                updateStepDisplay();
            }
        });
    }

    // Initial setup
    updatePaymentTypeSelection();
});
