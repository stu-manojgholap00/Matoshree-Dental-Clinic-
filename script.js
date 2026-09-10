/**
 * MATOSHREE DENTAL CLINIC - CORE APPLICATION ENGINE
 * Features: Dynamic Services, Real-time UPI QR Generation, WhatsApp Routing,
 * LocalStorage Backend, and Password-Protected Admin Panel (5525).
 */

document.addEventListener('DOMContentLoaded', () => {

    // ================= 1. INITIALIZATION & STORAGE ENGINE =================

    const DEFAULT_SETTINGS = {
        phone: '9422064602',
        upiId: '9422064602@upi',
        adminPass: '5525'
    };

    const DEFAULT_SERVICES = [
        { id: 'srv-1', icon: '🦷', name: 'Dental Check-up', price: 300, desc: 'Routine examination & professional consultation.' },
        { id: 'srv-2', icon: '✨', name: 'Teeth Cleaning', price: 1000, desc: 'Scaling and polishing for healthy teeth and gums.' },
        { id: 'srv-3', icon: '🪥', name: 'Root Canal Treatment', price: 3500, desc: 'Painless endodontic therapy to relieve severe tooth pain.' },
        { id: 'srv-4', icon: '😁', name: 'Cosmetic Dentistry', price: 2500, desc: 'Smiles enhancement, veneers, and aesthetic shaping.' }
    ];

    // Load state from local storage or set defaults
    let systemSettings = JSON.parse(localStorage.getItem('mdc_settings')) || DEFAULT_SETTINGS;
    let servicesList = JSON.parse(localStorage.getItem('mdc_services')) || DEFAULT_SERVICES;
    let bookingsList = JSON.parse(localStorage.getItem('mdc_bookings')) || [];

    let currentBookingPending = null;

    // Sync year in footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Ensure minimum date for appointment selector is Today
    const dateInput = document.getElementById('custDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }

    // ================= 2. UI RENDER ENGINE =================

    function renderServicesUI() {
        const grid = document.getElementById('serviceGrid');
        const select = document.getElementById('custService');
        
        if (!grid || !select) return;

        grid.innerHTML = '';
        select.innerHTML = '<option value="">Select Service</option>';

        servicesList.forEach(srv => {
            // Render Service Cards in UI
            const card = document.createElement('article');
            card.className = 'service-card';
            card.innerHTML = `
                <div class="service-icon">${srv.icon}</div>
                <h3>${srv.name}</h3>
                <p>${srv.desc}</p>
                <div class="service-price-tag">₹${srv.price}</div>
                <button class="btn btn-secondary btn-sm" onclick="quickSelectService('${srv.id}')">Select Service</button>
            `;
            grid.appendChild(card);

            // Populate Form Select Dropdown
            const option = document.createElement('option');
            option.value = srv.id;
            option.textContent = `${srv.name} (₹${srv.price})`;
            select.appendChild(option);
        });

        // Update Phone display in Contact section
        const phoneDisplay = document.getElementById('contactPhoneDisplay');
        if (phoneDisplay) {
            phoneDisplay.textContent = `+91 ${systemSettings.phone}`;
        }
    }

    window.quickSelectService = function(srvId) {
        const select = document.getElementById('custService');
        select.value = srvId;
        updateSelectedPrice();
        document.getElementById('appointment').scrollIntoView({ behavior: 'smooth' });
    };

    function updateSelectedPrice() {
        const select = document.getElementById('custService');
        const priceDisplay = document.getElementById('selectedPriceAmount');
        const selectedId = select.value;

        const found = servicesList.find(s => s.id === selectedId);
        if (found) {
            priceDisplay.textContent = `₹${found.price}`;
        } else {
            priceDisplay.textContent = '₹0';
        }
    }

    document.getElementById('custService').addEventListener('change', updateSelectedPrice);

    renderServicesUI();

    // ================= 3. MOBILE NAVIGATION =================

    const menuBtn = document.getElementById('menuBtn');
    const navMenu = document.getElementById('navMenu');

    menuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('#navMenu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // ================= 4. APPOINTMENT & PAYMENT FLOW =================

    const appointmentForm = document.getElementById('appointmentForm');
    const paymentModal = document.getElementById('paymentModal');
    const receiptModal = document.getElementById('receiptModal');

    appointmentForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate Inputs
        const name = document.getElementById('custName').value.trim();
        const phone = document.getElementById('custPhone').value.trim();
        const email = document.getElementById('custEmail').value.trim();
        const date = document.getElementById('custDate').value;
        const serviceId = document.getElementById('custService').value;

        let isValid = true;

        if (!name) {
            showError('nameError', 'Please enter your full name.');
            isValid = false;
        } else showError('nameError', '');

        if (!/^[6-9]\d{9}$/.test(phone)) {
            showError('phoneError', 'Enter a valid 10-digit Indian mobile number.');
            isValid = false;
        } else showError('phoneError', '');

        if (!date) {
            showError('dateError', 'Please select a date.');
            isValid = false;
        } else showError('dateError', '');

        if (!serviceId) {
            showError('serviceError', 'Please select a dental service.');
            isValid = false;
        } else showError('serviceError', '');

        if (!isValid) return;

        const serviceObj = servicesList.find(s => s.id === serviceId);

        // Save state for pending transaction
        currentBookingPending = {
            id: 'MDC-' + Math.floor(100000 + Math.random() * 900000),
            name,
            phone,
            email: email || 'N/A',
            date,
            serviceName: serviceObj.name,
            price: serviceObj.price,
            timestamp: new Date().toLocaleString()
        };

        openPaymentModal();
    });

    function showError(elementId, msg) {
        document.getElementById(elementId).textContent = msg;
    }

    function openPaymentModal() {
        document.getElementById('payPatientName').textContent = currentBookingPending.name;
        document.getElementById('payServiceName').textContent = currentBookingPending.serviceName;
        document.getElementById('payAmount').textContent = `₹${currentBookingPending.price}`;

        // Build UPI URI: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR
        const upiUri = `upi://pay?pa=${encodeURIComponent(systemSettings.upiId)}&pn=${encodeURIComponent('Matoshree Dental Clinic')}&am=${currentBookingPending.price}&cu=INR&tn=${encodeURIComponent(currentBookingPending.id)}`;

        // Clear and Render Dynamic QR Code
        const qrContainer = document.getElementById('qrcode');
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: upiUri,
            width: 180,
            height: 180
        });

        // Setup Direct Link button
        document.getElementById('directUpiBtn').href = upiUri;

        paymentModal.classList.add('active');
    }

    document.getElementById('closePaymentModal').addEventListener('click', () => {
        paymentModal.classList.remove('active');
    });

    // Confirm Payment Execution
    document.getElementById('confirmPaymentBtn').addEventListener('click', () => {
        // Save to bookings list
        bookingsList.push(currentBookingPending);
        localStorage.setItem('mdc_bookings', JSON.stringify(bookingsList));

        paymentModal.classList.remove('active');
        appointmentForm.reset();
        updateSelectedPrice();

        openReceiptModal(currentBookingPending);
    });

    // ================= 5. RECEIPT & WHATSAPP ENGINE =================

    function openReceiptModal(booking) {
        const receiptText = 
`==================================
      MATOSHREE DENTAL CLINIC
==================================
Booking Ref : ${booking.id}
Date        : ${booking.timestamp}
----------------------------------
Patient Name: ${booking.name}
Mobile      : ${booking.phone}
Email       : ${booking.email}
Appt Date   : ${booking.date}
----------------------------------
Service     : ${booking.serviceName}
Paid Amount : ₹${booking.price} [SUCCESS]
==================================
Thank you for choosing Matoshree Dental Clinic!`;

        document.getElementById('receiptContent').textContent = receiptText;

        // Configure WhatsApp Routing
        const sendWhatsappBtn = document.getElementById('sendWhatsappBtn');
        sendWhatsappBtn.onclick = () => {
            const encodedText = encodeURIComponent(receiptText);
            const targetPhone = systemSettings.phone.replace(/\D/g, '');
            const waUrl = `https://wa.me/91${targetPhone}?text=${encodedText}`;
            window.open(waUrl, '_blank');
        };

        receiptModal.classList.add('active');
    }

    document.getElementById('closeReceiptModal').addEventListener('click', () => {
        receiptModal.classList.remove('active');
    });

    // ================= 6. ADMIN PANEL (PASSWORD: 5525) =================

    const openAdminBtn = document.getElementById('openAdminBtn');
    const adminAuthModal = document.getElementById('adminAuthModal');
    const adminPanelModal = document.getElementById('adminPanelModal');
    const adminLoginForm = document.getElementById('adminLoginForm');

    openAdminBtn.addEventListener('click', (e) => {
        e.preventDefault();
        adminAuthModal.classList.add('active');
    });

    document.getElementById('closeAuthModal').addEventListener('click', () => {
        adminAuthModal.classList.remove('active');
    });

    adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPass = document.getElementById('adminPassInput').value.trim();

        if (enteredPass === systemSettings.adminPass) {
            document.getElementById('loginError').textContent = '';
            adminLoginForm.reset();
            adminAuthModal.classList.remove('active');
            openAdminPanel();
        } else {
            document.getElementById('loginError').textContent = 'Invalid Password! Access Denied.';
        }
    });

    function openAdminPanel() {
        document.getElementById('adminPhoneInput').value = systemSettings.phone;
        document.getElementById('adminUpiInput').value = systemSettings.upiId;

        renderAdminTables();
        adminPanelModal.classList.add('active');
    }

    document.getElementById('adminLogoutBtn').addEventListener('click', () => {
        adminPanelModal.classList.remove('active');
    });

    // Admin Tabs Switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Save Settings
    document.getElementById('settingsForm').addEventListener('submit', (e) => {
        e.preventDefault();
        systemSettings.phone = document.getElementById('adminPhoneInput').value.trim();
        systemSettings.upiId = document.getElementById('adminUpiInput').value.trim();

        localStorage.setItem('mdc_settings', JSON.stringify(systemSettings));
        alert('System Settings Updated Successfully!');
        renderServicesUI();
    });

    // Add New Service
    document.getElementById('addServiceForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const icon = document.getElementById('newServiceIcon').value.trim();
        const name = document.getElementById('newServiceName').value.trim();
        const price = parseFloat(document.getElementById('newServicePrice').value);
        const desc = document.getElementById('newServiceDesc').value.trim();

        const newService = {
            id: 'srv-' + Date.now(),
            icon,
            name,
            price,
            desc
        };

        servicesList.push(newService);
        localStorage.setItem('mdc_services', JSON.stringify(servicesList));

        document.getElementById('addServiceForm').reset();
        renderAdminTables();
        renderServicesUI();
    });

    // Delete Service Global Function
    window.deleteService = function(srvId) {
        if (confirm('Are you sure you want to remove this service?')) {
            servicesList = servicesList.filter(s => s.id !== srvId);
            localStorage.setItem('mdc_services', JSON.stringify(servicesList));
            renderAdminTables();
            renderServicesUI();
        }
    };

    // Delete Booking Global Function
    window.deleteBooking = function(bookingId) {
        if (confirm('Delete this booking log?')) {
            bookingsList = bookingsList.filter(b => b.id !== bookingId);
            localStorage.setItem('mdc_bookings', JSON.stringify(bookingsList));
            renderAdminTables();
        }
    };

    // Resend WhatsApp Receipt from Admin Panel
    window.resendReceipt = function(bookingId) {
        const booking = bookingsList.find(b => b.id === bookingId);
        if (booking) {
            openReceiptModal(booking);
        }
    };

    function renderAdminTables() {
        // Services Table
        const srvTbody = document.getElementById('adminServicesTable');
        srvTbody.innerHTML = '';
        servicesList.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${s.icon}</td>
                <td><strong>${s.name}</strong></td>
                <td>₹${s.price}</td>
                <td><button class="btn btn-danger btn-sm" onclick="deleteService('${s.id}')">Delete</button></td>
            `;
            srvTbody.appendChild(tr);
        });

        // Bookings Table
        const bookTbody = document.getElementById('adminBookingsTable');
        bookTbody.innerHTML = '';
        bookingsList.slice().reverse().forEach(b => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><small>${b.id}</small></td>
                <td>${b.name}</td>
                <td>${b.phone}</td>
                <td>${b.date}</td>
                <td>${b.serviceName}</td>
                <td>₹${b.price}</td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="resendReceipt('${b.id}')">Receipt</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteBooking('${b.id}')">&times;</button>
                </td>
            `;
            bookTbody.appendChild(tr);
        });
    }

});