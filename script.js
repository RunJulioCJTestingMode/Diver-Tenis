document.addEventListener('DOMContentLoaded', () => {
    const bookingGrid = document.getElementById('booking-grid');
    const courtBtns = document.querySelectorAll('.court-btn');
    const paymentModal = document.getElementById('payment-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const confirmPaymentBtn = document.getElementById('confirm-payment');
    const bookingDetails = document.getElementById('booking-details');

    let currentCourt = '1';
    let selectedSlot = null;

    // Load bookings from local storage
    let bookings = JSON.parse(localStorage.getItem('tennis_bookings')) || {};

    // Initialize Grid
    function renderGrid(courtId) {
        bookingGrid.innerHTML = '';
        const startHour = 6;
        const endHour = 21;

        for (let h = startHour; h <= endHour; h++) {
            const timeStr = `${h}:00 ${h < 12 ? 'AM' : 'PM'}`;
            const slotKey = `${courtId}-${h}`;
            const isBooked = bookings[slotKey];

            const slot = document.createElement('div');
            slot.className = `slot ${isBooked ? 'booked' : ''}`;
            slot.innerHTML = `
                <span class="time">${timeStr}</span>
                <span class="status">${isBooked ? 'Ocupado' : 'Disponible'}</span>
            `;

            if (!isBooked) {
                slot.onclick = () => openPaymentModal(courtId, h, timeStr);
            }

            bookingGrid.appendChild(slot);
        }
    }

    function initPayPalButton() {
        // Clear previous buttons if any
        bookingGrid.dataset.paypalInitialized = "true";
        
        paypal.Buttons({
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: '200.00'
                        },
                        description: `Renta de Cancha ${selectedSlot.courtId} - ${selectedSlot.timeStr}`
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    const slotKey = `${selectedSlot.courtId}-${selectedSlot.hour}`;
                    bookings[slotKey] = {
                        user: details.payer.name.given_name,
                        transactionId: details.id,
                        timestamp: new Date().toISOString()
                    };

                    localStorage.setItem('tennis_bookings', JSON.stringify(bookings));
                    
                    alert('¡Pago completado por ' + details.payer.name.given_name + '!');
                    
                    paymentModal.classList.add('hidden');
                    renderGrid(currentCourt);
                });
            },
            onError: function(err) {
                console.error('PayPal Error:', err);
                alert('Hubo un error con el proceso de pago. Intente de nuevo.');
            }
        }).render('#paypal-button-container');
    }

    function openPaymentModal(courtId, hour, timeStr) {
        selectedSlot = { courtId, hour, timeStr };
        bookingDetails.innerHTML = `
            <p><strong>Cancha:</strong> ${courtId}</p>
            <p><strong>Horario:</strong> ${timeStr}</p>
        `;
        paymentModal.classList.remove('hidden');
        
        // Initialize PayPal buttons only once or reset them
        document.getElementById('paypal-button-container').innerHTML = '';
        initPayPalButton();
    }

    closeModalBtn.onclick = () => {
        paymentModal.classList.add('hidden');
        selectedSlot = null;
    };

    // Court switching logic
    courtBtns.forEach(btn => {
        btn.onclick = () => {
            courtBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCourt = btn.dataset.court;
            renderGrid(currentCourt);
        };
    });

    // Initial render
    renderGrid(currentCourt);
});

