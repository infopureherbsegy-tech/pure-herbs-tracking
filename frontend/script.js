/* =========================================================
   SCREEN NAVIGATION
========================================================= */

function showLanding() {
    document
        .getElementById("auth")
        .classList
        .remove("active");

    document
        .getElementById("admin")
        .classList
        .remove("active");

    document
        .getElementById("customer")
        .classList
        .remove("active");

    document
        .getElementById("landing")
        .classList
        .remove("hidden");

    window.scrollTo(0, 0);
}

function showAuth() {
    document
        .getElementById("landing")
        .classList
        .add("hidden");

    document
        .getElementById("customer")
        .classList
        .remove("active");

    document
        .getElementById("admin")
        .classList
        .remove("active");

    document
        .getElementById("auth")
        .classList
        .add("active");

    showCustomerLogin();
    window.scrollTo(0, 0);
}

/* =========================================================
   PUBLIC TRACKING
========================================================= */


async function trackShipment() {

    const orderInput =
        document.getElementById("trackOrderNumber");

    const codeInput =
        document.getElementById("trackCode");

    const orderError =
        document.getElementById("trackOrderError");

    const codeError =
        document.getElementById("trackCodeError");

    const order =
        orderInput.value
            .trim()
            .toUpperCase();

    const code =
        codeInput.value
            .trim()
            .toUpperCase();

    orderError.textContent = "";
    codeError.textContent = "";

    orderInput.classList.remove("invalid");
    codeInput.classList.remove("invalid");

    if (!order) {

        orderError.textContent =
            "Order number is required.";

        orderInput.classList.add("invalid");

        return;
    }

    if (!code) {

        codeError.textContent =
            "Tracking code is required.";

        codeInput.classList.add("invalid");

        return;
    }

    const button =
        document.getElementById("trackShipmentBtn");

    const originalText =
        button.textContent;

    button.disabled = true;
    button.textContent = "Checking shipment...";

    try {

        const shipment =
            await loadTracking(code);

        if (
            !shipment ||
            shipment.orderId !== order ||
            shipment.code !== code
        ) {
            throw new Error(
                "We could not find this shipment."
            );
        }

        document
            .getElementById("trackStatusTitle")
            .textContent =
                shipment.status;

        document
            .getElementById("trackPill")
            .textContent =
                shipment.status;

        document
            .getElementById("trackVineFill")
            .style.width =
                shipment.pct + "%";

        document
            .getElementById("trackPct")
            .textContent =
                shipment.pct + "%";

        document
            .getElementById("trackOrderOut")
            .textContent =
                order;

        document
            .getElementById("trackDestinationOut")
            .textContent =
                shipment.destination;

        document
            .getElementById("trackUpdatedOut")
            .textContent =
                shipment.updated;

        document
            .getElementById("trackMessage")
            .textContent =
                shipment.message;

    } catch (error) {

        orderError.textContent =
            error.message ||
            "We could not find this shipment.";

        orderInput.classList.add("invalid");
        codeInput.classList.add("invalid");

    } finally {

        button.disabled = false;
        button.textContent = originalText;
    }
}

/* =========================================================
   AUTH
========================================================= */

function switchAuthTab(which) {

    const isSignIn = which === "signin";
    const isSignUp = which === "signup";
    const isForgot = which === "forgot";

    document
        .getElementById("tabSignIn")
        .classList
        .toggle("active", isSignIn);

    document
        .getElementById("tabSignUp")
        .classList
        .toggle("active", isSignUp);

    document
        .getElementById("signInView")
        .classList
        .toggle("hidden", !isSignIn);

    document
        .getElementById("signUpView")
        .classList
        .toggle("hidden", !isSignUp);

    document
        .getElementById("forgotPasswordView")
        .classList
        .toggle("hidden", !isForgot);

    document
        .getElementById("forgotLink")
        .classList
        .toggle("hidden", !isSignIn);

    document
        .getElementById("authError")
        .classList
        .add("hidden");

    document
        .getElementById("authError")
        .textContent = "";

    if (isForgot) {
        document
            .getElementById("forgotSuccess")
            .classList
            .add("hidden");
    }
}

const DEMO_EMAIL = "demo@pureherbs.com";
const DEMO_PASSWORD = "demo1234";

const CUSTOMER_STORAGE_KEY = "pureHerbsCustomers";
const SESSION_STORAGE_KEY = "pureHerbsSession";

/*
 * Privacy-first browser storage:
 * - Customer accounts live only in sessionStorage for this demo.
 * - Passwords are never stored in plain text.
 * - Login/signup form values are never persisted.
 * - The session disappears when the browser tab/window session ends.
 */
function getCustomers() {
    try {
        return JSON.parse(
            sessionStorage.getItem(CUSTOMER_STORAGE_KEY) || "[]"
        );
    } catch (error) {
        return [];
    }
}

function saveCustomers(customers) {
    sessionStorage.setItem(
        CUSTOMER_STORAGE_KEY,
        JSON.stringify(customers)
    );
}

async function hashPassword(value) {
    const data = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

function clearAuthFields() {
    [
        "loginEmail",
        "loginPassword",
        "signupName",
        "signupEmail",
        "signupPassword",
        "forgotEmail",
        "forgotNewPassword",
        "forgotConfirmPassword"
    ].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = "";
    });
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setFieldState(inputId, errorId, message) {

    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);

    if (!input || !error) {
        return;
    }

    input.classList.toggle("invalid", Boolean(message));
    error.textContent = message || "";
}

function showAdminLogin() {
    switchAuthTab("signin");

    clearAuthFields();

    const note = document.querySelector(".auth-role-note");

    if (note) {
        note.textContent =
            "Use your administrator account to access the operations dashboard.";
    }
}

function showCustomerLogin() {
    switchAuthTab("signin");

    const note = document.querySelector(".auth-role-note");

    if (note) {
        note.textContent =
            "Sign in with your customer account to view your shipments and delivery updates.";
    }
}

async function handleLogin() {

    const email = document
        .getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();

    const password = document
        .getElementById("loginPassword")
        .value;

    const banner = document.getElementById("authError");

    let valid = true;

    if (!email) {
        setFieldState(
            "loginEmail",
            "loginEmailError",
            "Email is required"
        );
        valid = false;
    } else if (!isValidEmail(email)) {
        setFieldState(
            "loginEmail",
            "loginEmailError",
            "Enter a valid email"
        );
        valid = false;
    } else {
        setFieldState("loginEmail", "loginEmailError", "");
    }

    if (!password) {
        setFieldState(
            "loginPassword",
            "loginPasswordError",
            "Password is required"
        );
        valid = false;
    } else {
        setFieldState("loginPassword", "loginPasswordError", "");
    }

    if (!valid) {
        banner.classList.add("hidden");
        return;
    }

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        sessionStorage.setItem(
            SESSION_STORAGE_KEY,
            JSON.stringify({
                role: "admin",
                email: DEMO_EMAIL,
                name: "Demo Admin"
            })
        );

        banner.classList.add("hidden");
        clearAuthFields();
        enterAdmin();
        return;
    }

    const passwordHash = await hashPassword(password);

    const customer = getCustomers().find(
        item =>
            item.email.toLowerCase() === email &&
            item.passwordHash === passwordHash
    );

    if (!customer) {
        banner.textContent =
            "Account not found or password is incorrect. Create a customer account first, or use Admin access for the demo dashboard.";
        banner.classList.remove("hidden");
        return;
    }

    sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
            role: "customer",
            email: customer.email,
            name: customer.name
        })
    );

    banner.classList.add("hidden");
    clearAuthFields();
    await enterCustomer(customer);
}

async function handleSignup() {

    const name = document
        .getElementById("signupName")
        .value
        .trim();

    const email = document
        .getElementById("signupEmail")
        .value
        .trim()
        .toLowerCase();

    const password = document
        .getElementById("signupPassword")
        .value;

    let valid = true;

    if (!name) {
        setFieldState(
            "signupName",
            "signupNameError",
            "Name is required"
        );
        valid = false;
    } else {
        setFieldState("signupName", "signupNameError", "");
    }

    if (!email) {
        setFieldState(
            "signupEmail",
            "signupEmailError",
            "Email is required"
        );
        valid = false;
    } else if (!isValidEmail(email)) {
        setFieldState(
            "signupEmail",
            "signupEmailError",
            "Enter a valid email"
        );
        valid = false;
    } else {
        setFieldState("signupEmail", "signupEmailError", "");
    }

    if (!password || password.length < 8) {
        setFieldState(
            "signupPassword",
            "signupPasswordError",
            "8 characters minimum"
        );
        valid = false;
    } else {
        setFieldState("signupPassword", "signupPasswordError", "");
    }

    if (!valid) {
        return;
    }

    const customers = getCustomers();

    if (
        email === DEMO_EMAIL ||
        customers.some(item => item.email.toLowerCase() === email)
    ) {
        setFieldState(
            "signupEmail",
            "signupEmailError",
            "An account already exists with this email"
        );
        return;
    }

    const customer = {
        id: "CUS-" + Date.now(),
        name,
        email,
        passwordHash: await hashPassword(password),
        createdAt: new Date().toISOString()
    };

    customers.push(customer);
    saveCustomers(customers);

    sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
            role: "customer",
            email: customer.email,
            name: customer.name
        })
    );

    await enterCustomer(customer);
}


async function handleForgotPassword() {

    const emailInput =
        document.getElementById("forgotEmail");

    const newPasswordInput =
        document.getElementById("forgotNewPassword");

    const confirmInput =
        document.getElementById("forgotConfirmPassword");

    const success =
        document.getElementById("forgotSuccess");

    const email =
        emailInput.value
            .trim()
            .toLowerCase();

    const newPassword =
        newPasswordInput.value;

    const confirmPassword =
        confirmInput.value;

    setFieldState(
        "forgotEmail",
        "forgotEmailError",
        ""
    );

    setFieldState(
        "forgotNewPassword",
        "forgotPasswordError",
        ""
    );

    setFieldState(
        "forgotConfirmPassword",
        "forgotConfirmError",
        ""
    );

    success.classList.add("hidden");

    let valid = true;

    if (!email || !isValidEmail(email)) {
        setFieldState(
            "forgotEmail",
            "forgotEmailError",
            "Enter a valid account email"
        );
        valid = false;
    }

    if (!newPassword || newPassword.length < 8) {
        setFieldState(
            "forgotNewPassword",
            "forgotPasswordError",
            "8 characters minimum"
        );
        valid = false;
    }

    if (newPassword !== confirmPassword) {
        setFieldState(
            "forgotConfirmPassword",
            "forgotConfirmError",
            "Passwords do not match"
        );
        valid = false;
    }

    if (!valid) {
        return;
    }

    if (email === DEMO_EMAIL) {
        setFieldState(
            "forgotEmail",
            "forgotEmailError",
            "The demo admin password cannot be reset from the customer portal."
        );
        return;
    }

    const customers = getCustomers();

    const customer =
        customers.find(
            item =>
                item.email.toLowerCase() === email
        );

    if (!customer) {
        setFieldState(
            "forgotEmail",
            "forgotEmailError",
            "No customer account was found with this email."
        );
        return;
    }

    customer.passwordHash = await hashPassword(newPassword);
    delete customer.password;
    saveCustomers(customers);

    success.textContent =
        "Password updated successfully. You can sign in with your new password.";

    success.classList.remove("hidden");

    newPasswordInput.value = "";
    confirmInput.value = "";

    setTimeout(() => {
        clearAuthFields();
        switchAuthTab("signin");
    }, 1000);
}


async function enterCustomer(customer) {

    document
        .getElementById("landing")
        .classList
        .add("hidden");

    document
        .getElementById("auth")
        .classList
        .remove("active");

    document
        .getElementById("admin")
        .classList
        .remove("active");

    document
        .getElementById("customer")
        .classList
        .add("active");

    await renderCustomerPortal(customer);

    window.scrollTo(0, 0);
}

async function renderCustomerPortal(customer) {

    const name = customer?.name || "Customer";
    const email = customer?.email || "";

    document.getElementById("customerName").textContent = name;
    document.getElementById("customerEmail").textContent = email;
    document.getElementById("customerWelcome").textContent =
        "Welcome, " + name.split(" ")[0] + ".";

    document.getElementById("customerAvatar").textContent =
        name.charAt(0).toUpperCase();

    try {
        await loadOrders();
    } catch (error) {
        showApiError(error);
        return;
    }

    const customerOrders = ORDERS.filter(
        order =>
            order.customer.toLowerCase() === name.toLowerCase() ||
            name.toLowerCase().includes("pure herbs")
    );

    const activeOrders = customerOrders.filter(
        order => ACTIVE_STATUSES.includes(order.status)
    );

    const deliveredOrders = customerOrders.filter(
        order => order.status === "Delivered"
    );

    const destinations = new Set(
        customerOrders.map(order => order.dest)
    );

    document.getElementById("customerTotalOrders").textContent =
        customerOrders.length;

    document.getElementById("customerActiveOrders").textContent =
        activeOrders.length;

    document.getElementById("customerDeliveredOrders").textContent =
        deliveredOrders.length;

    document.getElementById("customerDestinations").textContent =
        destinations.size;

    const container =
        document.getElementById("customerOrders");

    if (!customerOrders.length) {
        container.innerHTML = `
            <div class="customer-empty">
                <strong>No orders are linked to this account yet.</strong>
                <p style="margin-top:6px;">
                    Your account is ready. Once an order is assigned to your customer name,
                    it will appear here automatically.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = customerOrders.map(order => `
        <article class="customer-order-card">
            <div class="customer-order-top">
                <span class="customer-order-id">${order.id}</span>
                ${tagHTML(order.status)}
            </div>

            <div class="customer-order-product">
                ${order.product}
            </div>

            <div class="customer-order-meta">
                <span>Quantity: <b>${order.qty}</b></span>
                <span>Destination: <b>${order.dest}</b></span>
                <span>Expected: <b>${order.expected}</b></span>
            </div>

            <div class="customer-actions">
                <button
                    class="btn btn-primary"
                    type="button"
                    onclick="openOrderModal('${order.id}')"
                >
                    View Tracking →
                </button>
            </div>
        </article>
    `).join("");
}

function signOut() {

    sessionStorage.removeItem(SESSION_STORAGE_KEY);

    document
        .getElementById("admin")
        .classList
        .remove("active");

    document
        .getElementById("customer")
        .classList
        .remove("active");

    document
        .getElementById("landing")
        .classList
        .remove("hidden");

    document
        .getElementById("auth")
        .classList
        .remove("active");

    clearAuthFields();
    switchAuthTab("signin");
    showCustomerLogin();

    window.scrollTo(0, 0);
}

/* =========================================================
   KEYBOARD / FORM UX
========================================================= */

[
    ["loginEmail", "loginPassword", handleLogin],
    ["signupName", "signupPassword", handleSignup]
].forEach(([firstId, lastId, handler]) => {
    const first = document.getElementById(firstId);
    const last = document.getElementById(lastId);

    if (first) {
        first.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                handler();
            }
        });
    }

    if (last) {
        last.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                handler();
            }
        });
    }
});

document
    .getElementById("trackCode")
    .addEventListener("keydown", event => {
        if (event.key === "Enter") {
            trackShipment();
        }
    });

/* =========================================================
   ADMIN NAVIGATION
========================================================= */

async function enterAdmin() {

    document
        .getElementById("auth")
        .classList
        .remove("active");

    document
        .getElementById("admin")
        .classList
        .add("active");

    try {
        await loadOrders();
    } catch (error) {
        showApiError(error);
        return;
    }

    renderRecent();
    populateStatusSelect();
    renderOrders();
    await renderCustomersTable();
    await renderProductsTable();
    initCharts();

    setTimeout(() => {

        const toast =
            document.getElementById("welcomeToast");

        if (toast) {
            toast.style.display = "none";
        }

    }, 3000);
}

function showPage(name, element) {

    document
        .querySelectorAll(".nav li")
        .forEach(item =>
            item.classList.remove("active")
        );

    element.classList.add("active");

    document
        .querySelectorAll(".page")
        .forEach(page =>
            page.classList.remove("active")
        );

    document
        .getElementById("page-" + name)
        .classList
        .add("active");

    if (name === "customers") {
        renderCustomersTable();
    }

    if (name === "products") {
        renderProductsTable();
    }

    if (name === "settings") {
        loadSettingsPage();
    }

    if (name === "orders") {
        loadOrders()
            .then(() => {
                populateStatusSelect();
                renderOrders();
            })
            .catch(showApiError);
    }

    if (["quality","documents","shipments","notifications","audit"].includes(name)) {
        renderAdvancedPages();
    }
}

/* =========================================================
   ORDERS
========================================================= */



/* =========================================================
   BACKEND API CONNECTION
========================================================= */

const API_BASE_URL =
    window.location.protocol === "file:"
        ? "http://localhost:4000/api"
        : "/api";

let ORDERS = [];
let PUBLIC_TRACKING = {};

async function apiRequest(path, options = {}) {

    const response =
        await fetch(
            `${API_BASE_URL}${path}`,
            {
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                },
                ...options
            }
        );

    const data =
        await response
            .json()
            .catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Unable to connect to the Pure Herbs API."
        );
    }

    return data;
}

async function loadOrders() {

    const data =
        await apiRequest("/orders");

    ORDERS =
        data.orders || [];

    return ORDERS;
}

async function loadTracking(code) {

    const data =
        await apiRequest(
            `/tracking/${encodeURIComponent(code)}`
        );

    PUBLIC_TRACKING[code] =
        data;

    return data;
}


async function loadCustomers() {

    const data =
        await apiRequest("/customers");

    return data.customers || [];
}

async function loadProducts() {

    const data =
        await apiRequest("/products");

    return data.products || [];
}

async function createOrderFromAdmin(payload) {
    return apiRequest("/orders", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

async function createCustomerFromAdmin(payload) {
    return apiRequest("/customers", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}

async function createProductFromAdmin(payload) {
    return apiRequest("/products", {
        method: "POST",
        body: JSON.stringify(payload)
    });
}
async function updateOrderFromAdmin(id, input) { return apiRequest(`/orders/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) }); }
async function deleteOrderFromAdmin(id) { return apiRequest(`/orders/${encodeURIComponent(id)}`, { method: "DELETE" }); }
async function updateCustomerFromAdmin(id, input) { return apiRequest(`/customers/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(input) }); }
async function deleteCustomerFromAdmin(id) { return apiRequest(`/customers/${encodeURIComponent(id)}`, { method: "DELETE" }); }
async function updateProductFromAdmin(name, input) { return apiRequest(`/products/${encodeURIComponent(name)}`, { method: "PUT", body: JSON.stringify(input) }); }
async function deleteProductFromAdmin(name) { return apiRequest(`/products/${encodeURIComponent(name)}`, { method: "DELETE" }); }


function showApiError(error) {

    console.error(error);

    const message =
        error?.message ||
        "Unable to connect to the server.";

    const authError =
        document.getElementById("authError");

    if (authError) {
        authError.textContent =
            message;

        authError.classList.remove("hidden");
    }
}

const ORDER_STATUSES = [
    "Order Confirmed", "Raw Material Preparation", "Production", "Quality Control",
    "Approved", "Ready in Warehouse", "Loading", "Shipped", "In Transit",
    "Delivered", "Delayed", "On Hold", "Cancelled"
];

const TAG_CLASS = {
    "Ready in Warehouse": "warehouse",
    "In Transit": "transit",
    "Production": "production",
    "Delayed": "delayed",
    "Delivered": "delivered",
    "Quality Control": "qc",
    "Order Confirmed": "confirmed",
    "Shipped": "shipped",
    "Cancelled": "cancelled"
};

const ACTIVE_STATUSES = [
    "Order Confirmed",
    "Production",
    "Quality Control",
    "Ready in Warehouse",
    "Shipped",
    "In Transit"
];

function tagHTML(status) {

    const className =
        TAG_CLASS[status] || "active";

    return `
        <span class="tag tag-${className}">
            ${status}
        </span>
    `;
}

function renderRecent() {

    const body =
        document.getElementById("recentOrdersBody");

    body.innerHTML =
        ORDERS
            .slice(0,5)
            .map(order => `
                <tr>
                    <td class="mono-strong">
                        ${order.id}
                    </td>

                    <td>
                        ${order.customer}
                    </td>

                    <td>
                        ${order.product}
                        <br>
                        <span class="sub">
                            ${order.latin}
                        </span>
                    </td>

                    <td>
                        ${order.qty}
                    </td>

                    <td>
                        ${tagHTML(order.status)}
                    </td>

                    <td>
                        ${order.dest}
                    </td>

                    <td>
                        <span
                            class="view-btn"
                            onclick="openOrderModal('${order.id}')"
                        >
                            View Order
                        </span>
                    </td>
                </tr>
            `)
            .join("");
}

let currentFilter = "All";

function renderOrders() {

    const search =
        (
            document
                .getElementById("orderSearch")
                .value || ""
        ).toLowerCase();

    const status =
        document
            .getElementById("statusSelect")
            .value;

    const customer =
        document
            .getElementById("customerSelect")
            .value;

    const body =
        document.getElementById("ordersBody");

    const rows =
        ORDERS.filter(order => {

            if (
                currentFilter === "Active" &&
                !ACTIVE_STATUSES.includes(order.status)
            ) {
                return false;
            }

            if (
                currentFilter !== "All" &&
                currentFilter !== "Active" &&
                order.status !== currentFilter
            ) {
                return false;
            }

            if (
                status &&
                order.status !== status
            ) {
                return false;
            }

            if (
                customer &&
                order.customer !== customer
            ) {
                return false;
            }

            if (
                search &&
                !(
                    order.id
                        .toLowerCase()
                        .includes(search) ||

                    order.customer
                        .toLowerCase()
                        .includes(search) ||

                    order.product
                        .toLowerCase()
                        .includes(search)
                )
            ) {
                return false;
            }

            return true;
        });

    if (!rows.length) {

        body.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        No orders match these filters.
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    body.innerHTML =
        rows
            .map(order => `
                <tr>

                    <td class="mono-strong">
                        ${order.id}
                    </td>

                    <td>
                        ${order.customer}
                    </td>

                    <td>
                        ${order.product}
                        <br>
                        <span class="sub">
                            ${order.latin}
                        </span>
                    </td>

                    <td>
                        ${order.qty}
                    </td>

                    <td>
                        ${tagHTML(order.status)}
                    </td>

                    <td>
                        ${order.dest}
                    </td>

                    <td>
                        ${order.expected}
                    </td>

                    <td>
                        Aug 9, 2026 – 07:32 PM
                    </td>

                    <td>
                        <span
                            class="view-btn"
                            onclick="openOrderModal('${order.id}')"
                        >
                            View Order
                        </span>
                        <span class="view-btn" style="margin-left:10px" onclick="editOrder('${order.id}')">Edit</span>
                        <span
                            class="view-btn"
                            style="margin-left:10px"
                            onclick="openStatusModal('${order.id}')"
                        >
                            Edit Status
                        </span>
                    </td>

                </tr>
            `)
            .join("");
}

document
    .getElementById("orderFilterTabs")
    .addEventListener("click", event => {

        if (
            event.target.tagName !== "BUTTON"
        ) {
            return;
        }

        document
            .querySelectorAll(
                "#orderFilterTabs button"
            )
            .forEach(button =>
                button.classList.remove("active")
            );

        event.target.classList.add("active");

        currentFilter =
            event.target.dataset.f;

        renderOrders();
    });

function populateStatusSelect() {

    const select =
        document.getElementById("statusSelect");

    select.innerHTML = '<option value="">All statuses</option>';

    Object.keys(TAG_CLASS)
        .forEach(status => {

            const option =
                document.createElement("option");

            option.textContent =
                status;

            select.appendChild(option);
        });
}


/* =========================================================
   ADMIN DATA ENTRY
========================================================= */

let activeDataModalType = null;
let activeModalOrderId = null;

async function renderCustomersTable() {

    const body =
        document.getElementById("customersBody");

    if (!body) return;

    try {

        const customers =
            await loadCustomers();

        body.innerHTML =
            customers.length
                ? customers.map(customer => `
                    <tr>
                        <td class="mono-strong">
                            ${customer.name}
                        </td>
                        <td>
                            ${customer.email}
                        </td>
                        <td>
                            ${customer.country || "—"}
                        </td>
                        <td>
                            ${ORDERS.filter(
                                order =>
                                    order.customer.toLowerCase() ===
                                    customer.name.toLowerCase()
                            ).length}
                        </td>
                        <td>
                            <span class="tag ${customer.status === "Inactive" ? "" : "tag-active"}">
                                ${customer.status || "Active"}
                            </span>
                        </td>
                        <td>
                            <button class="view-btn" onclick="editCustomer('${customer.id}')">Edit</button>
                            <button class="view-btn danger-action" onclick="deleteCustomer('${customer.id}')">Delete</button>
                        </td>
                    </tr>
                `).join("")
                : `
                    <tr>
                        <td colspan="5">
                            <div class="empty-state">
                                No customers yet.
                            </div>
                        </td>
                    </tr>
                `;

        const select =
            document.getElementById("customerSelect");

        if (select) {

            const current =
                select.value;

            select.innerHTML =
                '<option value="">All customers</option>' +
                customers.map(
                    customer =>
                        `<option value="${customer.name}">${customer.name}</option>`
                ).join("");

            select.value = current;
        }

    } catch (error) {
        console.error(error);
    }
}

async function renderProductsTable() {

    const body =
        document.getElementById("productsBody");

    if (!body) return;

    try {

        const products =
            await loadProducts();

        body.innerHTML =
            products.length
                ? products.map(product => `
                    <tr>
                        <td class="mono-strong">
                            ${product.name}
                        </td>
                        <td class="sub">
                            ${product.latin || "—"}
                        </td>
                        <td>
                            ${product.category || "—"}
                        </td>
                        <td>
                            <span class="tag ${product.available === false ? "" : "tag-active"}">
                                ${product.available === false ? "Unavailable" : "Available"}
                            </span>
                        </td>
                        <td>
                            <button class="view-btn" onclick="editProduct('${encodeURIComponent(product.name)}')">Edit</button>
                            <button class="view-btn danger-action" onclick="deleteProduct('${encodeURIComponent(product.name)}')">Delete</button>
                        </td>
                    </tr>
                `).join("")
                : `
                    <tr>
                        <td colspan="4">
                            <div class="empty-state">
                                No products yet.
                            </div>
                        </td>
                    </tr>
                `;

    } catch (error) {
        console.error(error);
    }
}


async function editCustomer(id) {
    const customer = (await loadCustomers()).find(x => x.id === id);
    if (!customer) return;
    openDataModal("customer");
    activeDataModalType = "customer-edit";
    window.activeEditId = id;
    document.getElementById("dataModalTitle").textContent = "Edit Customer";
    document.getElementById("dataModalSubtitle").textContent = "Update customer information.";
    document.getElementById("dataSubmitButton").textContent = "Save Changes";
    document.getElementById("newCustomerName").value = customer.name || "";
    document.getElementById("newCustomerEmail").value = customer.email || "";
    document.getElementById("newCustomerCountry").value = customer.country || "";
}
async function deleteCustomer(id) {
    if (!confirm("Delete this customer? Their existing orders will remain.")) return;
    await deleteCustomerFromAdmin(id);
    await refreshAdminData();
}
async function editProduct(encodedName) {
    const name = decodeURIComponent(encodedName);
    const product = (await loadProducts()).find(x => x.name === name);
    if (!product) return;
    openDataModal("product");
    activeDataModalType = "product-edit";
    window.activeEditId = name;
    document.getElementById("dataModalTitle").textContent = "Edit Product";
    document.getElementById("dataModalSubtitle").textContent = "Update product catalog information.";
    document.getElementById("dataSubmitButton").textContent = "Save Changes";
    document.getElementById("newProductName").value = product.name || "";
    document.getElementById("newProductLatin").value = product.latin || "";
    document.getElementById("newProductCategory").value = product.category || "";
    document.getElementById("newProductAvailable").checked = product.available !== false;
}
async function deleteProduct(encodedName) {
    const name = decodeURIComponent(encodedName);
    if (!confirm("Delete this product?")) return;
    await deleteProductFromAdmin(name);
    await refreshAdminData();
}
async function editOrder(id) {
    const order = ORDERS.find(o => o.id === id) || (await apiRequest(`/orders/${encodeURIComponent(id)}`)).order;
    if (!order) return;
    openDataModal("order");
    activeDataModalType = "order-edit";
    window.activeEditId = id;
    document.getElementById("dataModalTitle").textContent = "Edit Order";
    document.getElementById("dataModalSubtitle").textContent = "Update shipment information without touching backend files.";
    document.getElementById("dataSubmitButton").textContent = "Save Changes";
    document.getElementById("newOrderId").value = order.id || "";
    document.getElementById("newOrderCustomer").value = order.customer || "";
    document.getElementById("newOrderProduct").value = order.product || "";
    document.getElementById("newOrderLatin").value = order.latin || "";
    document.getElementById("newOrderQty").value = order.qty || "";
    document.getElementById("newOrderStatus").value = order.status || "Order Confirmed";
    document.getElementById("newOrderDest").value = order.dest || "";
    document.getElementById("newOrderExpected").value = order.expected || "";
    document.getElementById("newOrderTracking").value = order.trackingCode || order.id || "";
}
async function deleteOrder(id) {
    if (!confirm(`Delete order ${id}? This also removes its tracking record and related operational records.`)) return;
    await deleteOrderFromAdmin(id);
    closeOrderModal();
    await refreshAdminData();
}


async function loadSettingsPage(){
    try{
        const data=await apiRequest('/settings'); const s=data.settings||{};
        const map={settingsCompanyName:s.companyName||'',settingsEmail:s.email||'',settingsPhone:s.phone||'',settingsAddress:s.address||'',settingsWebsite:s.website||''};
        Object.entries(map).forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.value=v;});
    }catch(e){showApiError(e);}
}
async function saveSettingsPage(){
    const payload={companyName:document.getElementById('settingsCompanyName').value.trim(),email:document.getElementById('settingsEmail').value.trim(),phone:document.getElementById('settingsPhone').value.trim(),address:document.getElementById('settingsAddress').value.trim(),website:document.getElementById('settingsWebsite').value.trim()};
    await apiRequest('/settings',{method:'PUT',body:JSON.stringify(payload)}); alert('Settings saved.');
}

async function loadAdvanced(orderId){ return apiRequest(`/orders/${encodeURIComponent(orderId)}/advanced`); }
function escAdvanced(v){ return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }
let advancedCache = null;
let advancedCacheAt = 0;
async function getAdvancedCollections(force = false) {
  const now = Date.now();
  if (!force && advancedCache && now - advancedCacheAt < 30000) return advancedCache;
  const [qcRes, docRes, shipRes, auditRes, notRes] = await Promise.all([
    apiRequest('/qc'), apiRequest('/documents'), apiRequest('/shipments'),
    apiRequest('/audit'), apiRequest('/notifications')
  ]);
  advancedCache = { qcRes, docRes, shipRes, auditRes, notRes };
  advancedCacheAt = now;
  return advancedCache;
}

function closeAdvancedAddModal(){
    const el = document.getElementById("advancedAddOverlay");
    if (el) el.remove();
}

function openAdvancedAddModal(type) {
    const configs = {
        qc: {
            title: "Add Quality Control",
            subtitle: "Create a quality-control record for an existing order.",
            fields: `
                <div class="adv-field">
                    <label>Order Number *</label>
                    <input id="addAdvOrderId" type="text" placeholder="ORD-1001" autocomplete="off">
                </div>
                <div class="adv-field">
                    <label>Test Name *</label>
                    <input id="advTest" type="text" placeholder="Moisture">
                </div>
                <div class="adv-field">
                    <label>Result *</label>
                    <input id="advResult" type="text" placeholder="8.2">
                </div>
                <div class="adv-field">
                    <label>Specification</label>
                    <input id="advSpec" type="text" placeholder="≤ 10">
                </div>
                <div class="adv-field">
                    <label>Unit</label>
                    <input id="advUnit" type="text" placeholder="%">
                </div>
                <div class="adv-field">
                    <label>Status</label>
                    <select id="advStatus">
                        <option value="PASSED">Passed</option>
                        <option value="FAILED">Failed</option>
                        <option value="PENDING">Pending</option>
                    </select>
                </div>
                <label class="adv-check">
                    <input id="advVisible" type="checkbox" checked>
                    <span>Customer visible</span>
                </label>
            `
        },
        document: {
            title: "Add Document",
            subtitle: "Attach a document record to an existing order.",
            fields: `
                <div class="adv-field">
                    <label>Order Number *</label>
                    <input id="addAdvOrderId" type="text" placeholder="ORD-1001" autocomplete="off">
                </div>
                <div class="adv-field">
                    <label>Document Name *</label>
                    <input id="advName" type="text" placeholder="Certificate of Analysis">
                </div>
                <div class="adv-field">
                    <label>Document Type</label>
                    <select id="advDocType">
                        <option value="COA">Certificate of Analysis</option>
                        <option value="Invoice">Invoice</option>
                        <option value="Packing List">Packing List</option>
                        <option value="Quality Certificate">Quality Certificate</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="adv-field">
                    <label>Version</label>
                    <input id="advVersion" type="text" placeholder="v1.0">
                </div>
                <div class="adv-field">
                    <label>Document Date</label>
                    <input id="advDocDate" type="date">
                </div>
                <div class="adv-field">
                    <label>File Name</label>
                    <input id="advFileName" type="text" placeholder="COA-1001.pdf">
                </div>
                <div class="adv-field">
                    <label>Visibility</label>
                    <select id="advVisibility">
                        <option value="customer">Customer visible</option>
                        <option value="internal">Internal only</option>
                    </select>
                </div>
            `
        },
        shipment: {
            title: "Add Shipment",
            subtitle: "Create the shipment and container details for an order.",
            fields: `
                <div class="adv-field">
                    <label>Order Number *</label>
                    <input id="addAdvOrderId" type="text" placeholder="ORD-1001" autocomplete="off">
                </div>
                <div class="adv-field">
                    <label>Container Number</label>
                    <input id="advContainer" type="text" placeholder="MSKU1234567">
                </div>
                <div class="adv-field">
                    <label>Seal Number</label>
                    <input id="advSeal" type="text" placeholder="SEAL12345">
                </div>
                <div class="adv-field">
                    <label>Vessel</label>
                    <input id="advVessel" type="text" placeholder="MSC Example">
                </div>
                <div class="adv-field">
                    <label>Voyage</label>
                    <input id="advVoyage" type="text" placeholder="024E">
                </div>
                <div class="adv-field">
                    <label>Port of Loading</label>
                    <input id="advLoading" type="text" placeholder="Alexandria">
                </div>
                <div class="adv-field">
                    <label>Destination</label>
                    <input id="advDestination" type="text" placeholder="Rotterdam">
                </div>
                <div class="adv-field">
                    <label>ETD</label>
                    <input id="advEtd" type="datetime-local">
                </div>
                <div class="adv-field">
                    <label>ETA</label>
                    <input id="advEta" type="datetime-local">
                </div>
                <div class="adv-field">
                    <label>B/L Number</label>
                    <input id="advBl" type="text" placeholder="BL123456">
                </div>
            `
        },
        notification: {
            title: "Add Notification",
            subtitle: "Create a notification that can be linked to an order.",
            fields: `
                <div class="adv-field">
                    <label>Order Number</label>
                    <input id="advNotificationOrder" type="text" placeholder="Optional" autocomplete="off">
                </div>
                <div class="adv-field">
                    <label>Title *</label>
                    <input id="advNotificationTitle" type="text" placeholder="Shipment loaded">
                </div>
                <div class="adv-field adv-full">
                    <label>Message *</label>
                    <textarea id="advNotificationMessage" rows="5" placeholder="Write the notification..."></textarea>
                </div>
                <div class="adv-field">
                    <label>Type</label>
                    <select id="advNotificationType">
                        <option value="info">Information</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="alert">Alert</option>
                    </select>
                </div>
                <label class="adv-check">
                    <input id="advNotificationEnabled" type="checkbox" checked>
                    <span>Enabled</span>
                </label>
            `
        }
    };

    const config = configs[type];
    if (!config) return;

    closeAdvancedAddModal();

    const overlay = document.createElement("div");
    overlay.id = "advancedAddOverlay";
    overlay.className = "modal-overlay active";

    overlay.innerHTML = `
        <div class="advanced-add-modal" role="dialog" aria-modal="true" aria-labelledby="advancedAddTitle">
            <div class="advanced-add-header">
                <div>
                    <div class="advanced-add-eyebrow">PURE HERBS · ADMIN</div>
                    <h3 id="advancedAddTitle">${config.title}</h3>
                    <p>${config.subtitle}</p>
                </div>
                <button type="button" class="advanced-add-close" aria-label="Close" onclick="closeAdvancedAddModal()">×</button>
            </div>

            <form id="advancedAddForm" class="advanced-add-form-wrap">
                <div class="advanced-add-grid">${config.fields}</div>
                <div id="advEditorError" class="advanced-add-error" role="alert"></div>

                <div class="advanced-add-actions">
                    <button type="button" class="btn btn-light" onclick="closeAdvancedAddModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="advancedAddSaveButton">Save</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(overlay);

    const form = document.getElementById("advancedAddForm");
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        saveAdvancedAdd(type);
    });

    overlay.addEventListener("click", function (event) {
        if (event.target === overlay) closeAdvancedAddModal();
    });

    const first = overlay.querySelector("input, textarea, select");
    if (first) setTimeout(() => first.focus(), 30);
}

function openQualityAdd(){ openAdvancedAddModal("qc"); }
function openDocumentsAdd(){ openAdvancedAddModal("document"); }
function openShipmentsAdd(){ openAdvancedAddModal("shipment"); }
function openNotificationsAdd(){ openAdvancedAddModal("notification"); }
function addNotificationFromPage(){ openNotificationsAdd(); }
function addAdvancedFromPage(type){ openAdvancedAddModal(type); }

async function saveAdvancedAdd(type){
    const error = document.getElementById("advEditorError");
    const button = document.getElementById("advancedAddSaveButton");

    const fail = (message) => {
        if (error) error.textContent = message;
        if (button) {
            button.disabled = false;
            button.textContent = "Save";
        }
    };

    try {
        if (error) error.textContent = "";
        if (button) {
            button.disabled = true;
            button.textContent = "Saving…";
        }

        let endpoint = "";
        let body = {};
        const orderInput = document.getElementById("addAdvOrderId");
        const orderId = orderInput ? orderInput.value.trim().toUpperCase() : "";

        if (type !== "notification") {
            if (!orderId) return fail("Order Number is required.");

            if (ORDERS.length && !ORDERS.some(
                order => String(order.id).toUpperCase() === orderId
            )) {
                return fail("Order not found. Enter an existing Order Number.");
            }
        }

        if (type === "qc") {
            body = {
                test: document.getElementById("advTest").value.trim(),
                result: document.getElementById("advResult").value.trim(),
                spec: document.getElementById("advSpec").value.trim(),
                unit: document.getElementById("advUnit").value.trim(),
                status: document.getElementById("advStatus").value,
                customerVisible: document.getElementById("advVisible").checked,
                by: "Quality"
            };

            if (!body.test || !body.result) {
                return fail("Test Name and Result are required.");
            }

            endpoint = `/orders/${encodeURIComponent(orderId)}/qc`;

        } else if (type === "document") {
            body = {
                orderId,
                name: document.getElementById("advName").value.trim(),
                documentType: document.getElementById("advDocType").value,
                version: document.getElementById("advVersion").value.trim(),
                date: document.getElementById("advDocDate").value,
                fileName: document.getElementById("advFileName").value.trim(),
                visibility: document.getElementById("advVisibility").value,
                by: "Admin"
            };

            if (!body.name) return fail("Document Name is required.");
            endpoint = "/documents";

        } else if (type === "shipment") {
            body = {
                orderId,
                container: document.getElementById("advContainer").value.trim(),
                seal: document.getElementById("advSeal").value.trim(),
                vessel: document.getElementById("advVessel").value.trim(),
                voyage: document.getElementById("advVoyage").value.trim(),
                loading: document.getElementById("advLoading").value.trim(),
                destination: document.getElementById("advDestination").value.trim(),
                etd: document.getElementById("advEtd").value,
                eta: document.getElementById("advEta").value,
                blNumber: document.getElementById("advBl").value.trim(),
                by: "Shipping"
            };

            endpoint = "/shipments";

        } else if (type === "notification") {
            body = {
                order: document.getElementById("advNotificationOrder").value.trim().toUpperCase(),
                title: document.getElementById("advNotificationTitle").value.trim(),
                message: document.getElementById("advNotificationMessage").value.trim(),
                type: document.getElementById("advNotificationType").value,
                enabled: document.getElementById("advNotificationEnabled").checked,
                by: "Admin"
            };

            if (!body.title || !body.message) {
                return fail("Title and Message are required.");
            }

            endpoint = "/notifications";
        }

        await apiRequest(endpoint, {
            method: "POST",
            body: JSON.stringify(body)
        });

        closeAdvancedAddModal();
        advancedCache = null;

        try {
            await renderAdvancedPages(true);
        } catch (renderError) {
            console.error("Saved successfully, but table refresh failed:", renderError);
        }

        if (type !== "notification" && orderId && typeof openOrderModal === "function") {
            try { await openOrderModal(orderId); } catch (_) {}
        }

    } catch (e) {
        fail(e.message || "Could not save this record.");
    }
}

window.openAdvancedAddModal = openAdvancedAddModal;
window.openQualityAdd = openQualityAdd;
window.openDocumentsAdd = openDocumentsAdd;
window.openShipmentsAdd = openShipmentsAdd;
window.openNotificationsAdd = openNotificationsAdd;
window.addAdvancedFromPage = addAdvancedFromPage;
window.addNotificationFromPage = addNotificationFromPage;
window.closeAdvancedAddModal = closeAdvancedAddModal;

async function deleteAdvancedRecord(type,id){
    if(!confirm(`Delete this ${type} record?`)) return;
    const endpoints={qc:`/qc/${encodeURIComponent(id)}`,document:`/documents/${encodeURIComponent(id)}`,shipment:`/shipments/${encodeURIComponent(id)}`,notification:`/notifications/${encodeURIComponent(id)}`};
    await apiRequest(endpoints[type],{method:'DELETE'}); await renderAdvancedPages(true);
}
async function editAdvancedRecord(type,id){
    const {qcRes,docRes,shipRes,notRes}=await getAdvancedCollections(true);
    const sources={qc:qcRes.qc,document:docRes.documents,shipment:shipRes.shipments,notification:notRes.notifications};
    const item=(sources[type]||[]).find(x=>x.id===id); if(!item) return;
    const fields={qc:['test','result','spec','unit','status'],document:['name','version','visibility','fileName'],shipment:['container','seal','vessel','voyage','loading','destination','etd','eta','bl'],notification:['message','order','enabled']};
    const next={...item};
    for(const key of fields[type]){ const value=prompt(`Edit ${key}`,String(item[key] ?? '')); if(value===null)return; next[key]=key==='enabled'?value.toLowerCase()!=='false':value; }
    const endpoints={qc:`/qc/${encodeURIComponent(id)}`,document:`/documents/${encodeURIComponent(id)}`,shipment:`/shipments/${encodeURIComponent(id)}`,notification:`/notifications/${encodeURIComponent(id)}`};
    await apiRequest(endpoints[type],{method:'PUT',body:JSON.stringify(next)}); await renderAdvancedPages(true);
}

async function renderAdvancedPages(force = false){
  try{
    const {qcRes,docRes,shipRes,auditRes,notRes}=await getAdvancedCollections(force);
    const qb=document.getElementById('qualityBody'); if(qb) qb.innerHTML=(qcRes.qc||[]).map(q=>`<tr><td>${escAdvanced(q.orderId)}</td><td>${escAdvanced((ORDERS.find(o=>o.id===q.orderId)||{}).product||'—')}</td><td>${escAdvanced(q.test)}</td><td>${escAdvanced(q.result)}</td><td>${escAdvanced(q.spec)} ${escAdvanced(q.unit)}</td><td>${escAdvanced(q.status)}</td><td>${escAdvanced(q.date)}</td><td><button class="view-btn" onclick="editAdvancedRecord('qc','${q.id}')">Edit</button> <button class="view-btn danger-action" onclick="deleteAdvancedRecord('qc','${q.id}')">Delete</button></td></tr>`).join('')||'<tr><td colspan="8">No QC records.</td></tr>';
    const db=document.getElementById('documentsBody'); if(db) db.innerHTML=(docRes.documents||[]).map(d=>`<tr><td>${escAdvanced(d.name)}</td><td>${escAdvanced(d.orderId)}</td><td>${escAdvanced(d.version)}</td><td>${d.visibility==='customer'?'<span class="tag tag-active">Customer Visible</span>':'<span class="tag">Internal Only</span>'}</td><td>${escAdvanced(d.date)}</td><td><button class="view-btn" onclick="editAdvancedRecord('document','${d.id}')">Edit</button> <button class="view-btn danger-action" onclick="deleteAdvancedRecord('document','${d.id}')">Delete</button></td></tr>`).join('')||'<tr><td colspan="6">No documents.</td></tr>';
    const sb=document.getElementById('shipmentsBody'); if(sb) sb.innerHTML=(shipRes.shipments||[]).map(s=>`<tr><td>${escAdvanced(s.orderId)}</td><td>${escAdvanced(s.container)}</td><td>${escAdvanced(s.seal)}</td><td>${escAdvanced(s.vessel)}</td><td>${escAdvanced(s.loading)}</td><td>${escAdvanced(s.destination)}</td><td>${escAdvanced(s.etd)}</td><td>${escAdvanced(s.eta)}</td><td><button class="view-btn" onclick="editAdvancedRecord('shipment','${s.id}')">Edit</button> <button class="view-btn danger-action" onclick="deleteAdvancedRecord('shipment','${s.id}')">Delete</button></td></tr>`).join('')||'<tr><td colspan="9">No shipment records.</td></tr>';
    const ab=document.getElementById('auditBody'); if(ab) ab.innerHTML=(auditRes.audit||[]).slice().reverse().map(a=>`<tr><td>${escAdvanced(a.date)}</td><td>${escAdvanced(a.user)}</td><td>${escAdvanced(a.action)}</td><td>${escAdvanced(a.order||'—')}</td><td>${escAdvanced(a.previousStatus||'—')}</td><td>${escAdvanced(a.newStatus||'—')}</td><td>${escAdvanced(a.details||'')}</td></tr>`).join('')||'<tr><td colspan="7">No audit events.</td></tr>';
    const nb=document.getElementById('notificationsBody'); if(nb) nb.innerHTML=(notRes.notifications||[]).slice().reverse().map(n=>`<div class="card" style="margin:8px 0"><b>${escAdvanced(n.message||'')}</b><div class="sub">${escAdvanced(n.order||'')} · ${escAdvanced(n.date||'')}</div><div style="margin-top:8px"><button class="view-btn" onclick="editAdvancedRecord('notification','${n.id}')">Edit</button> <button class="view-btn danger-action" onclick="deleteAdvancedRecord('notification','${n.id}')">Delete</button></div></div>`).join('')||'<div class="empty-state">No notification events.</div>';
    const nt=document.getElementById('notificationTemplates'); if(nt) nt.innerHTML=['Your order has entered production.','Quality Control has been completed.','Your order is ready in the warehouse.','Your shipment has been loaded.','Your order has been shipped.','Your shipment is currently in transit.','Your order has been delivered.'].map(x=>`<div class="card" style="margin:8px 0"><span>${x}</span><span class="tag tag-active" style="float:right">Enabled</span></div>`).join('');
  }catch(e){ console.error(e); }
}

async function refreshAdminData() {

    try {
        await loadOrders();
        renderRecent();
        populateStatusSelect();
        renderOrders();
        await renderCustomersTable();
        await renderProductsTable();
    } catch (error) {
        showApiError(error);
    }
}

function openDataModal(type) {

    activeDataModalType = type;

    document
        .getElementById("dataModalOverlay")
        .classList
        .add("active");

    document
        .getElementById("orderFormFields")
        .classList
        .toggle("hidden", type !== "order");

    document
        .getElementById("customerFormFields")
        .classList
        .toggle("hidden", type !== "customer");

    document
        .getElementById("productFormFields")
        .classList
        .toggle("hidden", type !== "product");

    const titles = {
        order: "Add New Order",
        customer: "Add Customer",
        product: "Add Product"
    };

    const subtitles = {
        order: "Create a shipment directly from the admin website.",
        customer: "Add a customer without editing backend files.",
        product: "Add a product to your catalog from the dashboard."
    };

    document
        .getElementById("dataModalTitle")
        .textContent =
            titles[type];

    document
        .getElementById("dataModalSubtitle")
        .textContent =
            subtitles[type];

    document
        .getElementById("dataSubmitButton")
        .textContent =
            type === "order"
                ? "Create Order"
                : type === "customer"
                    ? "Create Customer"
                    : "Create Product";

    document
        .getElementById("dataFormError")
        .classList
        .add("hidden");

    document
        .getElementById("dataForm")
        .reset();

    document
        .getElementById("newOrderStatus")
        .value =
            "Order Confirmed";
}

function closeDataModal() {

    document
        .getElementById("dataModalOverlay")
        .classList
        .remove("active");

    activeDataModalType = null;
}

async function submitDataForm(event) {

    event.preventDefault();

    const errorBox =
        document.getElementById("dataFormError");

    errorBox.classList.add("hidden");
    errorBox.textContent = "";

    try {

        if (activeDataModalType === "order" || activeDataModalType === "order-edit") {

            const id =
                document
                    .getElementById("newOrderId")
                    .value
                    .trim()
                    .toUpperCase();

            const trackingCode =
                (
                    document
                        .getElementById("newOrderTracking")
                        .value
                        .trim()
                        .toUpperCase() ||
                    id
                );

            const orderPayload = {
                id, trackingCode,
                customer: document.getElementById("newOrderCustomer").value.trim(),
                product: document.getElementById("newOrderProduct").value.trim(),
                latin: document.getElementById("newOrderLatin").value.trim(),
                qty: document.getElementById("newOrderQty").value.trim(),
                status: document.getElementById("newOrderStatus").value,
                dest: document.getElementById("newOrderDest").value.trim(),
                expected: document.getElementById("newOrderExpected").value
            };
            if (activeDataModalType === "order-edit") {
                await updateOrderFromAdmin(window.activeEditId, orderPayload);
            } else {
                await createOrderFromAdmin(orderPayload);
            }

            closeDataModal();
            await refreshAdminData();

        } else if (activeDataModalType === "customer" || activeDataModalType === "customer-edit") {

            const customerPayload = {
                name:
                    document
                        .getElementById("newCustomerName")
                        .value
                        .trim(),
                email:
                    document
                        .getElementById("newCustomerEmail")
                        .value
                        .trim()
                        .toLowerCase(),
                country:
                    document
                        .getElementById("newCustomerCountry")
                        .value
                        .trim()
            };
            if (activeDataModalType === "customer-edit") {
                await updateCustomerFromAdmin(window.activeEditId, customerPayload);
            } else {
                await createCustomerFromAdmin(customerPayload);
            }
            closeDataModal();
            await refreshAdminData();

        } else if (activeDataModalType === "product" || activeDataModalType === "product-edit") {

            const productPayload = {
                name: document.getElementById("newProductName").value.trim(),
                latin: document.getElementById("newProductLatin").value.trim(),
                category: document.getElementById("newProductCategory").value.trim(),
                available: document.getElementById("newProductAvailable")?.checked !== false
            };
            if (activeDataModalType === "product-edit") {
                await updateProductFromAdmin(window.activeEditId, productPayload);
            } else {
                await createProductFromAdmin(productPayload);
            }
            closeDataModal();
            await refreshAdminData();
        }

    } catch (error) {

        errorBox.textContent =
            error.message ||
            "Could not save the data.";

        errorBox.classList.remove("hidden");
    }
}

async function downloadDocument(type) {

    if (!activeModalOrderId) {
        const title =
            document
                .getElementById("mOrderId")
                .textContent
                .trim();

        activeModalOrderId = title;
    }

    if (!activeModalOrderId) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/orders/${encodeURIComponent(activeModalOrderId)}/documents/${encodeURIComponent(type)}`
            );

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(
                data.message ||
                "Document could not be downloaded."
            );
        }

        const blob =
            await response.blob();

        const url =
            URL.createObjectURL(blob);

        const anchor =
            document.createElement("a");

        anchor.href = url;
        anchor.download =
            `${type}-${activeModalOrderId}.html`;

        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(url);

    } catch (error) {
        showApiError(error);
    }
}


function openOrderInNewTab(orderId) {
    // Backward-compatible name: orders now open in the current page modal.
    openOrderModal(orderId);
}

function ensureStatusModal() {
    if (document.getElementById("statusEditOverlay")) return;
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "statusEditOverlay";
    overlay.innerHTML = `
      <div class="data-modal" role="dialog" aria-modal="true" aria-labelledby="statusEditTitle">
        <div class="data-modal-head">
          <button class="modal-close-button" type="button" onclick="closeStatusModal()">✕</button>
          <h3 id="statusEditTitle">Update Order Status</h3>
          <p id="statusEditLabel">—</p>
        </div>
        <div class="data-modal-body">
          <div class="field">
            <label>New Status</label>
            <select class="select" id="statusEditSelect"></select>
          </div>
          <div class="field" style="margin-top:14px">
            <label>Update Note</label>
            <textarea id="statusEditNote" rows="4" placeholder="Optional note for the status history"></textarea>
          </div>
          <label style="display:flex;align-items:center;gap:9px;margin-top:14px;font-size:12px">
            <input type="checkbox" id="statusEditNotify"> Notify customer
          </label>
          <div id="statusEditError" class="form-error" style="margin-top:12px"></div>
          <div class="data-modal-actions">
            <button class="btn btn-light" type="button" onclick="closeStatusModal()">Cancel</button>
            <button class="btn btn-primary" type="button" onclick="saveStatusUpdate()">Save Status</button>
          </div>
        </div>
      </div>`;
    overlay.addEventListener("click", e => { if (e.target === overlay) closeStatusModal(); });
    document.body.appendChild(overlay);
}

async function openStatusModal(orderId) {
    ensureStatusModal();
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) return;
    const select = document.getElementById("statusEditSelect");
    const statuses = ORDER_STATUSES;
    select.innerHTML = statuses.map(s => `<option value="${escAdvanced(s)}">${escAdvanced(s)}</option>`).join("");
    select.value = order.status;
    document.getElementById("statusEditLabel").textContent = `Updating ${order.id} · Current status: ${order.status}`;
    document.getElementById("statusEditNote").value = "";
    document.getElementById("statusEditNotify").checked = false;
    document.getElementById("statusEditError").textContent = "";
    document.getElementById("statusEditOverlay").classList.add("active");
}

function closeStatusModal() {
    const el = document.getElementById("statusEditOverlay");
    if (el) el.classList.remove("active");
}

async function saveStatusUpdate() {
    const orderId = ORDERS.find(o => o.id === document.getElementById("statusEditLabel").textContent.split("Updating ")[1]?.split(" ·")[0])?.id;
    if (!orderId) {
        const label = document.getElementById("statusEditLabel").textContent;
        const match = label.match(/^Updating (.+?) ·/);
        if (!match) return;
    }
    const id = orderId || document.getElementById("statusEditLabel").textContent.match(/^Updating (.+?) ·/)?.[1];
    const errorBox = document.getElementById("statusEditError");
    errorBox.textContent = "";
    try {
        const result = await apiRequest(`/orders/${encodeURIComponent(id)}/status`, {
            method: "POST",
            body: JSON.stringify({
                status: document.getElementById("statusEditSelect").value,
                note: document.getElementById("statusEditNote").value.trim(),
                notify: document.getElementById("statusEditNotify").checked,
                by: "Admin"
            })
        });
        const updated = result.order;
        const idx = ORDERS.findIndex(o => o.id === updated.id);
        if (idx >= 0) ORDERS[idx] = updated;
        closeStatusModal();
        renderRecent();
        renderOrders();
        if (activeModalOrderId === updated.id) await openOrderModal(updated.id);
        renderAdvancedPages(true);
        
    } catch (e) {
        errorBox.textContent = e.message || "Could not update status.";
    }
}


function openAdvancedEditor(orderId, type) {
    const titles = {qc:"Add Quality Control Result", document:"Add Order Document", shipment:"Update Shipment"};
    const fields = {
      qc: `<input id="advTest" placeholder="Test name"><input id="advResult" placeholder="Result"><input id="advSpec" placeholder="Specification"><input id="advUnit" placeholder="Unit"><select id="advStatus"><option>PASSED</option><option>FAILED</option><option>PENDING</option></select><label><input type="checkbox" id="advVisible" checked> Customer visible</label>`,
      document: `<input id="advName" placeholder="Document name"><input id="advVersion" placeholder="Version"><select id="advVisibility"><option value="customer">Customer visible</option><option value="internal">Internal only</option></select><input id="advFileName" placeholder="File name (optional)">`,
      shipment: `<input id="advContainer" placeholder="Container number"><input id="advSeal" placeholder="Seal number"><input id="advVessel" placeholder="Vessel"><input id="advVoyage" placeholder="Voyage"><input id="advLoading" placeholder="Port of loading"><input id="advDestination" placeholder="Port of destination"><input id="advEtd" placeholder="ETD"><input id="advEta" placeholder="ETA"><input id="advBl" placeholder="B/L number">`
    };
    const overlay=document.createElement('div'); overlay.className='modal-overlay active'; overlay.id='advancedEditorOverlay';
    overlay.innerHTML=`<div class="data-modal" role="dialog"><div class="data-modal-head"><button class="modal-close-button" type="button" onclick="document.getElementById('advancedEditorOverlay').remove()">✕</button><h3>${titles[type]}</h3><p>${escAdvanced(orderId)}</p></div><div class="data-modal-body"><div style="display:grid;gap:10px">${fields[type]}</div><div id="advEditorError" class="form-error" style="margin-top:12px"></div><div class="data-modal-actions"><button class="btn btn-light" type="button" onclick="document.getElementById('advancedEditorOverlay').remove()">Cancel</button><button class="btn btn-primary" type="button" onclick="saveAdvancedEditor('${orderId}','${type}')">Save</button></div></div></div>`;
    document.body.appendChild(overlay);
}
async function saveAdvancedEditor(orderId,type){
  const error=document.getElementById('advEditorError');
  try{
    let endpoint, body;
    if(type==='qc'){ endpoint=`/orders/${encodeURIComponent(orderId)}/qc`; body={test:document.getElementById('advTest').value,result:document.getElementById('advResult').value,spec:document.getElementById('advSpec').value,unit:document.getElementById('advUnit').value,status:document.getElementById('advStatus').value,customerVisible:document.getElementById('advVisible').checked,by:'Quality'}; }
    else if(type==='document'){ endpoint='/documents'; body={orderId,name:document.getElementById('advName').value,version:document.getElementById('advVersion').value,visibility:document.getElementById('advVisibility').value,fileName:document.getElementById('advFileName').value,by:'Admin'}; }
    else { endpoint='/shipments'; body={orderId,container:document.getElementById('advContainer').value,seal:document.getElementById('advSeal').value,vessel:document.getElementById('advVessel').value,voyage:document.getElementById('advVoyage').value,loading:document.getElementById('advLoading').value,destination:document.getElementById('advDestination').value,etd:document.getElementById('advEtd').value,eta:document.getElementById('advEta').value,blNumber:document.getElementById('advBl').value,by:'Shipping'}; }
    await apiRequest(endpoint,{method:'POST',body:JSON.stringify(body)});
    document.getElementById('advancedEditorOverlay').remove();
    advancedCache = null;
    await renderAdvancedPages(true);
    if (type !== 'notification') await openOrderModal(orderId);
  }catch(e){ error.textContent=e.message||'Could not save.'; }
}

/* =========================================================
   ORDER MODAL
========================================================= */

const JOURNEY_STEPS = [
    {
        key: "Order Confirmed",
        label: "Confirmed",
        substeps: [
            "Order confirmed",
            "Contract / PO confirmed",
            "Advance payment received",
            "Order released"
        ]
    },
    {
        key: "Production",
        label: "Production",
        substeps: [
            "Raw material released",
            "Transferred to production",
            "Processing",
            "Sorting & cleaning",
            "Final inspection",
            "Production completed"
        ]
    },
    {
        key: "Quality Control",
        label: "Quality Control",
        substeps: [
            "Sampling",
            "Laboratory testing",
            "Results reviewed",
            "Quality approved",
            "COA issued"
        ]
    },
    {
        key: "Ready in Warehouse",
        label: "Warehouse",
        substeps: [
            "Finished product received",
            "Final packing",
            "Quantity verified",
            "Ready for export",
            "Export documents prepared"
        ]
    },
    {
        key: "Shipped",
        label: "Shipped",
        substeps: [
            "Export clearance completed",
            "Container loaded",
            "Container sealed",
            "Vessel loaded",
            "Vessel departed"
        ]
    },
    {
        key: "In Transit",
        label: "In Transit",
        substeps: [
            "Shipment in transit",
            "Arrived at destination port",
            "Import clearance",
            "Balance Payment Pending",
            "Balance Payment Received",
            "Documents Released to Customer"
        ]
    },
    {
        key: "Delivered",
        label: "Delivered",
        substeps: [
            "Released for delivery",
            "Out for delivery",
            "Delivered"
        ]
    }
];

const STATUS_PROGRESS = {
    "Order Confirmed": 12,
    "Production": 32,
    "Quality Control": 50,
    "Ready in Warehouse": 65,
    "Shipped": 78,
    "In Transit": 90,
    "Delivered": 100,
    "Delayed": 45,
    "Cancelled": 0
};

const STATUS_STEP_INDEX = {
    "Order Confirmed": 0,
    "Production": 1,
    "Quality Control": 2,
    "Ready in Warehouse": 3,
    "Shipped": 4,
    "In Transit": 5,
    "Delivered": 6,
    "Delayed": 1,
    "Cancelled": 0
};

async function openOrderModal(orderId) {

    let order =
        ORDERS.find(
            item => item.id === orderId
        );

    try {

        const data =
            await apiRequest(
                `/orders/${encodeURIComponent(orderId)}`
            );

        order =
            data.order;

    } catch (error) {

        showApiError(error);
        return;
    }

    if (!order) {
        return;
    }

    activeModalOrderId = order.id;

    document
        .getElementById("mOrderId")
        .textContent =
            order.id;

    document
        .getElementById("mCustomer")
        .textContent =
            order.customer +
            " · " +
            order.dest;

    document
        .getElementById("mProduct")
        .innerHTML =
            order.product +
            "<br><span class='sub'>" +
            order.latin +
            "</span>";

    document
        .getElementById("mQty")
        .textContent =
            order.qty;

    document
        .getElementById("mDest")
        .textContent =
            order.dest;

    document
        .getElementById("mExpected")
        .textContent =
            order.expected;

    document
        .getElementById("mStatusTitle")
        .textContent =
            order.status;

    document
        .getElementById("mPill")
        .textContent =
            ACTIVE_STATUSES.includes(order.status)
                ? "In progress"
                : order.status === "Delivered"
                    ? "Completed"
                    : order.status;

    const percentage =
        STATUS_PROGRESS[order.status] ?? 0;

    document
        .getElementById("mVineFill")
        .style.width =
            percentage + "%";

    document
        .getElementById("mPct")
        .textContent =
            percentage + "%";

    const alertBox =
        document.getElementById("mAlert");

    if (order.status === "Delayed") {

        alertBox.innerHTML = `
            <div class="m-alert">
                ⚠ This shipment is delayed.
                Our team is working to get it back on schedule.
            </div>
        `;

    } else if (order.status === "Cancelled") {

        alertBox.innerHTML = `
            <div class="m-alert cancelled">
                ✕ This order has been cancelled.
            </div>
        `;

    } else {

        alertBox.innerHTML = "";
    }

    const currentIndex =
        STATUS_STEP_INDEX[order.status] ?? 0;

    const cancelled =
        order.status === "Cancelled";

    const progressStops = [
        0,
        STATUS_PROGRESS["Order Confirmed"],
        STATUS_PROGRESS["Production"],
        STATUS_PROGRESS["Quality Control"],
        STATUS_PROGRESS["Ready in Warehouse"],
        STATUS_PROGRESS["Shipped"],
        STATUS_PROGRESS["In Transit"],
        STATUS_PROGRESS["Delivered"]
    ];

    document
        .getElementById("mStepper")
        .innerHTML =
            JOURNEY_STEPS
                .map((step, index) => {

                    let className = "";

                    if (!cancelled) {

                        if (index < currentIndex) {
                            className = "done";
                        }

                        if (index === currentIndex) {
                            className = "current";
                        }

                    } else if (index === currentIndex) {

                        className = "cancelled";
                    }

                    const mark =
                        className === "done"
                            ? "✓"
                            : index + 1;

                    const stageStart =
                        progressStops[index];

                    const stageEnd =
                        progressStops[index + 1];

                    const stageRange =
                        Math.max(
                            stageEnd - stageStart,
                            1
                        );

                    const stageRatio =
                        Math.min(
                            Math.max(
                                (percentage - stageStart) /
                                stageRange,
                                0
                            ),
                            1
                        );

                    const completedSubsteps =
                        className === "done"
                            ? step.substeps.length
                            : className === "current"
                                ? Math.floor(
                                    stageRatio *
                                    step.substeps.length
                                )
                                : 0;

                    const substepsHTML =
                        step.substeps
                            .map(
                                (substep, subIndex) => {

                                    let subClass = "";

                                    if (
                                        subIndex <
                                        completedSubsteps
                                    ) {
                                        subClass = "done";
                                    } else if (
                                        className === "current" &&
                                        subIndex ===
                                            completedSubsteps
                                    ) {
                                        subClass = "current";
                                    }

                                    return `
                                        <div class="m-substep ${subClass}">
                                            ${substep}
                                        </div>
                                    `;
                                }
                            )
                            .join("");

                    const stateLabel =
                        className === "done"
                            ? "Completed"
                            : className === "current"
                                ? "In progress"
                                : "Upcoming";

                    return `
                        <div class="m-step ${className}">

                            <div class="m-step-marker">
                                <div class="dot">
                                    ${mark}
                                </div>
                            </div>

                            <div class="m-step-content">

                                <div class="m-step-head">

                                    <div>
                                        <div class="m-step-number">
                                            Step ${index + 1}
                                        </div>

                                        <div class="m-step-title">
                                            ${step.label}
                                        </div>
                                    </div>

                                    <span class="m-step-state">
                                        ${stateLabel}
                                    </span>

                                </div>

                                <div class="m-substeps">
                                    ${substepsHTML}
                                </div>

                            </div>

                        </div>
                    `;
                })
                .join("");

    try {
        const advanced = await loadAdvanced(order.id);
        const box = document.getElementById("mAdvancedDetails");
        if (box) {
            const visibleDocs = (advanced.documents || []).filter(d => d.visibility === "customer");
            const qc = advanced.qc || [];
            const hist = advanced.history || [];
            const ship = advanced.shipment;
            const shipment = ship || (order.containerQty || order.vessel || order.etd || order.eta ? {
                container: order.containerQty, vessel: order.vessel, voyage: order.voyage,
                loading: order.portOfLoading, destination: order.portOfDischarge,
                etd: order.etd, eta: order.eta, line: order.serviceCode, forwarder: order.forwarder
            } : null);
            const customer = (await loadCustomers()).find(c => String(c.name).toLowerCase() === String(order.customer).toLowerCase());
            const field = (label, value) => `<div><div class="m-label">${escAdvanced(label)}</div><div class="m-value">${escAdvanced(value || '—')}</div></div>`;
            box.innerHTML = `
                <div class="m-docs" style="margin-top:18px">
                  <div class="m-docs-head"><h5>Customer Information</h5><span class="m-docs-note">Account details</span></div>
                  <div class="m-meta-grid">
                    ${field('Customer', order.customer)}
                    ${field('Email', customer?.email)}
                    ${field('Country', customer?.country)}
                    ${field('Tracking Code', order.trackingCode || order.id)}
                  </div>
                </div>
                <div class="m-docs" style="margin-top:18px">
                  <div class="m-docs-head"><h5>Commercial & Export Information</h5><span class="m-docs-note">Complete order data</span></div>
                  <div class="m-meta-grid">
                    ${field('Invoice Number', order.invoiceNumber)}
                    ${field('Invoice Date', order.invoiceDate || order.orderDate)}
                    ${field('Purchase Order', order.po)}
                    ${field('Booking Status', order.bookingStatus)}
                    ${field('Booking Party', order.bookingParty)}
                    ${field('Forwarder', order.forwarder)}
                    ${field('HS Code', order.hsCode)}
                    ${field('Lot / Batch', order.lotNumber || order.batch)}
                    ${field('Packing', order.packing)}
                    ${field('Origin', order.origin || 'Egypt')}
                    ${field('Cargo Weight', order.cargoWeight || order.totalGrossWeight)}
                    ${field('Traffic Mode', order.trafficMode)}
                  </div>
                </div>` + `
                <div class="m-docs" style="margin-top:18px">
                  <div class="m-docs-head"><h5>Order Information</h5><span class="m-docs-note">Shipment order details</span></div>
                  <div class="m-meta-grid">
                    <div><div class="m-label">Order Date</div><div class="m-value">${escAdvanced(order.invoiceDate || order.orderDate || '—')}</div></div>
                    <div><div class="m-label">Purchase Order</div><div class="m-value">${escAdvanced(order.po || '—')}</div></div>
                    <div><div class="m-label">Batch / Lot</div><div class="m-value">${escAdvanced(order.batch || order.lotNumber || '—')}</div></div>
                    <div><div class="m-label">Packing</div><div class="m-value">${escAdvanced(order.packing || '—')}</div></div>
                    <div><div class="m-label">Origin</div><div class="m-value">${escAdvanced(order.origin || 'Egypt')}</div></div>
                    <div><div class="m-label">HS Code</div><div class="m-value">${escAdvanced(order.hsCode || '—')}</div></div>
                  </div>
                </div>
                <div class="m-docs" style="margin-top:18px">
                  <div class="m-docs-head"><h5>Order History</h5><span class="m-docs-note">Status updates</span></div>
                  <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 12px">
                    <button class="btn btn-light" type="button" onclick="openStatusModal('${order.id}')">Edit Status</button>
                    <button class="btn btn-light" type="button" onclick="openAdvancedEditor('${order.id}','qc')">Add QC</button>
                    <button class="btn btn-light" type="button" onclick="openAdvancedEditor('${order.id}','document')">Add Document</button>
                    <button class="btn btn-light" type="button" onclick="openAdvancedEditor('${order.id}','shipment')">Update Shipment</button>
                  </div>
                  ${hist.length ? hist.map(h=>`<div class="m-doc"><div><b>${escAdvanced(h.status)}</b><small>${escAdvanced(h.date)} · ${escAdvanced(h.by)}</small><small>${escAdvanced(h.note)}</small></div></div>`).join('') : '<div class="empty-state">No status history yet. Use Edit Status to create the first history event.</div>'}
                </div>
                <div class="m-docs" style="margin-top:18px">
                  <div class="m-docs-head"><h5>Quality Control</h5><span class="m-docs-note">Approved customer-visible results</span></div>
                  ${qc.filter(q=>q.customerVisible!==false).length ? qc.filter(q=>q.customerVisible!==false).map(q=>`<div class="m-doc"><div><b>${escAdvanced(q.test)}</b><small>${escAdvanced(q.result)} · ${escAdvanced(q.spec)} ${escAdvanced(q.unit)}</small><small>${escAdvanced(q.status)} · ${escAdvanced(q.date)}</small></div></div>`).join('') : '<div class="empty-state">No approved QC results available.</div>'}
                </div>
                <div class="m-docs" style="margin-top:18px">
                  <div class="m-docs-head"><h5>Shipment Details</h5><span class="m-docs-note">International shipping</span></div>
                  ${shipment ? `<div class="m-meta-grid"><div><div class="m-label">Container</div><div class="m-value">${escAdvanced(shipment.container||'—')}</div></div><div><div class="m-label">Vessel / Voyage</div><div class="m-value">${escAdvanced(shipment.vessel||'—')} / ${escAdvanced(shipment.voyage||'—')}</div></div><div><div class="m-label">Port of Loading</div><div class="m-value">${escAdvanced(shipment.loading||'—')}</div></div><div><div class="m-label">Port of Destination</div><div class="m-value">${escAdvanced(shipment.destination||'—')}</div></div><div><div class="m-label">ETD</div><div class="m-value">${escAdvanced(shipment.etd||'—')}</div></div><div><div class="m-label">ETA</div><div class="m-value">${escAdvanced(shipment.eta||'—')}</div></div></div>` : '<div class="empty-state">Shipment information will appear when the order is shipped.</div>'}
                </div>
                <div class="m-docs" style="margin-top:18px">
                  <div class="m-docs-head"><h5>Approved Documents</h5><span class="m-docs-note">Customer visible</span></div>
                  ${visibleDocs.length ? visibleDocs.map(d=>`<div class="m-doc"><div><b>${escAdvanced(d.name)}</b><small>${escAdvanced(d.version)} · ${escAdvanced(d.date)}</small></div></div>`).join('') : '<div class="empty-state">No additional uploaded documents yet.</div>'}
                </div>`;
        }
    } catch (e) { console.error(e); }

    document
        .getElementById("orderModalOverlay")
        .classList
        .add("active");
}


function closeOrderModal() {

    const overlay =
        document.getElementById("orderModalOverlay");

    if (overlay) {
        overlay.classList.remove("active");
    }

    activeModalOrderId = null;
}


/* =========================================================
   CHARTS
========================================================= */

let chartsInit = false;

function initCharts() {

    if (chartsInit) {
        return;
    }

    chartsInit = true;

    const forest = "#173B2C";
    const gold = "#D2A23E";
    const blue = "#2E5FA3";

    new Chart(
        document.getElementById("statusChart"),
        {
            type: "bar",

            data: {
                labels: [
                    "Warehouse",
                    "Transit",
                    "Production",
                    "Delayed",
                    "Delivered",
                    "QC",
                    "Confirmed",
                    "Shipped",
                    "Cancelled"
                ],

                datasets: [
                    {
                        data: [
                            "Ready in Warehouse",
                            "In Transit",
                            "Production",
                            "Delayed",
                            "Delivered",
                            "Quality Control",
                            "Order Confirmed",
                            "Shipped",
                            "Cancelled"
                        ].map(status =>
                            ORDERS.filter(order => order.status === status).length
                        ),

                        backgroundColor: forest,

                        borderRadius: 4
                    }
                ]
            },

            options: {
                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            stepSize: 1
                        },

                        grid: {
                            color: "#EFEAE0"
                        }
                    },

                    x: {
                        grid: {
                            display: false
                        },

                        ticks: {
                            display: false
                        }
                    }
                }
            }
        }
    );

    new Chart(
        document.getElementById("countryChart"),
        {
            type: "pie",

            data: {
                labels: [
                    "USA",
                    "United Kingdom",
                    "Germany"
                ],

                datasets: [
                    {
                        data: ["USA", "United Kingdom", "Germany"].map(country =>
                            ORDERS.filter(order => order.dest === country).length
                        ),

                        backgroundColor: [
                            forest,
                            gold,
                            blue
                        ],

                        borderWidth: 0
                    }
                ]
            },

            options: {
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        }
    );

    new Chart(
        document.getElementById("productsChart"),
        {
            type: "bar",

            data: {
                labels: [
                    "Chamomile Flowers",
                    "Hibiscus Flowers",
                    "Peppermint Leaves",
                    "Moringa Leaves",
                    "Anise Seeds",
                    "Fennel Seeds"
                ],

                datasets: [
                    {
                        data: [
                            "Chamomile Flowers",
                            "Hibiscus Flowers",
                            "Peppermint Leaves",
                            "Moringa Leaves",
                            "Anise Seeds",
                            "Fennel Seeds"
                        ].map(product =>
                            ORDERS.filter(order => order.product === product).length
                        ),

                        backgroundColor: gold,

                        borderRadius: 4
                    }
                ]
            },

            options: {
                indexAxis: "y",

                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    x: {
                        beginAtZero: true,

                        ticks: {
                            stepSize: 1
                        },

                        grid: {
                            color: "#EFEAE0"
                        }
                    },

                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        }
    );

    new Chart(
        document.getElementById("monthlyChart"),
        {
            type: "line",

            data: {
                labels: [
                    "2026-04",
                    "2026-05",
                    "2026-06",
                    "2026-07",
                    "2026-08"
                ],

                datasets: [
                    {
                        data: [
                            Math.max(0, ORDERS.length - 8),
                            1,
                            1,
                            2,
                            4
                        ],

                        borderColor: forest,

                        backgroundColor:
                            "rgba(23,59,44,0.08)",

                        fill: true,

                        tension: .4,

                        pointRadius: 3,

                        borderWidth: 3
                    }
                ]
            },

            options: {
                plugins: {
                    legend: {
                        display: false
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,

                        ticks: {
                            stepSize: 1
                        },

                        grid: {
                            color: "#EFEAE0"
                        }
                    },

                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        }
    );
}

/* =========================================================
   INITIAL STATE
   Always open on the public landing page.
========================================================= */

showLanding();

(async function openRequestedOrder() {
    const orderId = new URLSearchParams(window.location.search).get("viewOrder");
    if (!orderId) return;
    try {
        await loadOrders();
        ["landing", "auth", "admin", "customer"].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.remove("active"); el.classList.add("hidden"); }
        });
        await openOrderModal(orderId);
    } catch (error) {
        showApiError(error);
    }
})();
