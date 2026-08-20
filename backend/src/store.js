const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let Pool = null;
try {
    ({ Pool } = require("pg"));
} catch (_) {
    // PostgreSQL is optional for local development.
}

const dataPath = process.env.DATA_FILE
    ? path.resolve(process.env.DATA_FILE)
    : path.join(__dirname, "data.json");

const databaseUrl = String(process.env.DATABASE_URL || "").trim();
const pool = databaseUrl && Pool
    ? new Pool({
        connectionString: databaseUrl,
        ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
        max: 5
    })
    : null;

let dbWriteQueue = Promise.resolve();
let persistenceReady = false;

const defaultData = {
    orders: [
        {
            id: "OOLU2336262600",
            customer: "Pure Herbs For The Export Of Aromatic Herbs And Seeds",
            product: "Coriander Seeds",
            latin: "Coriandrum sativum",
            qty: "32,000 kg",
            status: "Order Confirmed",
            dest: "Felixstowe, United Kingdom",
            expected: "12 Sep 2026",

            bookingStatus: "Confirmed",
            bookingParty: "Smart Express",
            forwarder: "Smart Express",
            containerQty: "2 × 40' Hi-Cube",
            cargoWeight: "18,000 kg",
            trafficMode: "FCL / FCL",
            placeOfReceipt: "El Dekheila, Al Iskandariyah, Egypt",
            portOfLoading: "El Dekheila / ACCHCO El Dekheila Terminal",
            portOfLoadingETA: "28 Aug 2026",
            vessel: "XIN LIAN YUN GANG 634N",
            voyage: "634N",
            etd: "30 Aug 2026",
            serviceCode: "NET2",
            vesselFlag: "China",
            portOfDischarge: "Felixstowe / Trinity Terminal Felixstowe",
            eta: "12 Sep 2026",
            cargoAvailability: "14 Sep 2026 15:00",
            cyCutoff: "26 Aug 2026 23:00",
            siCutoff: "25 Aug 2026 09:00",
            vgmCutoff: "26 Aug 2026 23:00",
            ucr: "6308047371022320022",
            csReference: "CSO5872218866",
            rateAgreement: "00151570",
            hsCode: "090921",
            invoiceNumber: "2662",
            invoiceDate: "20 Jun 2026",
            lotNumber: "K 26 / KK 26",
            packing: "40 jumbo bags (20 per container / 800 kg net per bag)",
            origin: "Egypt",
            totalGrossWeight: "32,160 kg",
            co2TTW: "1,603.41 kg",
            co2WTW: "1,883.82 kg",
            progress: 12,
            updated: "13 Aug 2026"
        }
    ],

    trackingByCode: {
        OOLU2336262600: {
            code: "OOLU2336262600",
            orderId: "OOLU2336262600",
            status: "Confirmed",
            pct: 12,
            destination: "Felixstowe, United Kingdom",
            updated: "13 Aug 2026",
            message:
                "Booking confirmed. Intended vessel: XIN LIAN YUN GANG 634N. ETD: 30 Aug 2026. ETA Felixstowe: 12 Sep 2026."
        }
    },

    registeredUsers: [],

    customers: [
        {
            id: "CUS-GREEN-MARKET",
            name: "Green Market",
            email: "contact@greenmarket.com",
            country: "USA",
            status: "Active"
        },
        {
            id: "CUS-HERBAL-HOUSE",
            name: "Herbal House",
            email: "hello@herbalhouse.com",
            country: "United Kingdom",
            status: "Active"
        },
        {
            id: "CUS-NATURE-FOODS",
            name: "Nature Foods",
            email: "orders@naturefoods.com",
            country: "Germany",
            status: "Active"
        }
    ],

    statusHistory: [],
    qcTests: [],
    documents: [],
    shipments: [],
    notifications: [],
    auditLogs: [],
    settings: {
        companyName: "PURE HERBS",
        email: "",
        phone: "",
        address: "",
        website: ""
    },

    products: [
        { name: "Chamomile Flowers", latin: "Matricaria chamomilla", category: "Flowers", available: true },
        { name: "Hibiscus Flowers", latin: "Hibiscus sabdariffa", category: "Flowers", available: true },
        { name: "Peppermint Leaves", latin: "Mentha piperita", category: "Leaves", available: true },
        { name: "Moringa Leaves", latin: "Moringa oleifera", category: "Leaves", available: true },
        { name: "Anise Seeds", latin: "Pimpinella anisum", category: "Seeds", available: true },
        { name: "Fennel Seeds", latin: "Foeniculum vulgare", category: "Seeds", available: true },
        { name: "Coriander Seeds", latin: "Coriandrum sativum", category: "Seeds", available: true }
    ]
};

function cloneDefault() {
    return JSON.parse(
        JSON.stringify(defaultData)
    );
}

function ensureDataFile() {

    if (!fs.existsSync(dataPath)) {

        fs.writeFileSync(
            dataPath,
            JSON.stringify(
                defaultData,
                null,
                2
            ),
            "utf8"
        );
    }
}

function loadData() {

    ensureDataFile();

    try {

        const data =
            JSON.parse(
                fs.readFileSync(
                    dataPath,
                    "utf8"
                )
            );

        return {
            ...cloneDefault(),
            ...data,
            orders: data.orders || [],
            trackingByCode:
                data.trackingByCode || {},
            registeredUsers:
                data.registeredUsers || [],
            customers:
                data.customers || [],
            products:
                data.products || [],
            statusHistory: data.statusHistory || [],
            qcTests: data.qcTests || [],
            documents: data.documents || [],
            shipments: data.shipments || [],
            notifications: data.notifications || [],
            auditLogs: data.auditLogs || [],
            settings: data.settings || cloneDefault().settings
        };

    } catch (error) {
        // If a previous write was interrupted, recover the last good snapshot
        // instead of silently resetting the whole application to defaults.
        const backupPath = dataPath + ".bak";

        try {
            if (fs.existsSync(backupPath)) {
                const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
                console.warn("data.json was invalid; recovered the last backup.");
                return {
                    ...cloneDefault(),
                    ...backup,
                    orders: backup.orders || [],
                    trackingByCode: backup.trackingByCode || {},
                    registeredUsers: backup.registeredUsers || [],
                    customers: backup.customers || [],
                    products: backup.products || [],
                    statusHistory: backup.statusHistory || [],
                    qcTests: backup.qcTests || [],
                    documents: backup.documents || [],
                    shipments: backup.shipments || [],
                    notifications: backup.notifications || [],
                    auditLogs: backup.auditLogs || [],
                    settings: backup.settings || cloneDefault().settings
                };
            }
        } catch (backupError) {
            console.error("Could not recover data backup:", backupError);
        }

        throw new Error(
            `Could not read ${dataPath}. The file is corrupted and was not overwritten. Restore ${dataPath}.bak or fix the JSON manually.`
        );
    }
}

function saveData(data) {
    // Atomic write + backup: prevents partial JSON writes from wiping data.
    const tempPath = dataPath + ".tmp";
    const backupPath = dataPath + ".bak";
    const json = JSON.stringify(data, null, 2);

    fs.writeFileSync(tempPath, json, "utf8");

    if (fs.existsSync(dataPath)) {
        try { fs.copyFileSync(dataPath, backupPath); }
        catch (error) { console.warn("Could not create data backup:", error.message); }
    }

    fs.renameSync(tempPath, dataPath);
}

async function initPersistence() {
    if (!pool) {
        persistenceReady = true;
        return;
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS pure_herbs_state (
            id INTEGER PRIMARY KEY,
            state JSONB NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    const result = await pool.query(
        "SELECT state FROM pure_herbs_state WHERE id = 1"
    );

    if (result.rows.length) {
        applyState(result.rows[0].state);
    } else {
        await saveToDatabase(getStateSnapshot());
    }

    persistenceReady = true;
}

function getStateSnapshot() {
    return JSON.parse(JSON.stringify({
        orders,
        trackingByCode,
        customers,
        registeredUsers,
        products,
        statusHistory,
        qcTests,
        documents,
        shipments,
        notifications,
        auditLogs,
        settings
    }));
}

function applyState(next) {
    const safe = next && typeof next === "object" ? next : {};
    const defaults = cloneDefault();
    const normalized = {
        ...defaults,
        ...safe,
        orders: Array.isArray(safe.orders) ? safe.orders : [],
        trackingByCode: safe.trackingByCode && typeof safe.trackingByCode === "object" ? safe.trackingByCode : {},
        registeredUsers: Array.isArray(safe.registeredUsers) ? safe.registeredUsers : [],
        customers: Array.isArray(safe.customers) ? safe.customers : [],
        products: Array.isArray(safe.products) ? safe.products : [],
        statusHistory: Array.isArray(safe.statusHistory) ? safe.statusHistory : [],
        qcTests: Array.isArray(safe.qcTests) ? safe.qcTests : [],
        documents: Array.isArray(safe.documents) ? safe.documents : [],
        shipments: Array.isArray(safe.shipments) ? safe.shipments : [],
        notifications: Array.isArray(safe.notifications) ? safe.notifications : [],
        auditLogs: Array.isArray(safe.auditLogs) ? safe.auditLogs : [],
        settings: safe.settings && typeof safe.settings === "object" ? safe.settings : defaults.settings
    };

    Object.assign(data, normalized);
    orders.splice(0, orders.length, ...normalized.orders);
    customers.splice(0, customers.length, ...normalized.customers);
    registeredUsers.splice(0, registeredUsers.length, ...normalized.registeredUsers);
    products.splice(0, products.length, ...normalized.products);
    statusHistory.splice(0, statusHistory.length, ...normalized.statusHistory);
    qcTests.splice(0, qcTests.length, ...normalized.qcTests);
    documents.splice(0, documents.length, ...normalized.documents);
    shipments.splice(0, shipments.length, ...normalized.shipments);
    notifications.splice(0, notifications.length, ...normalized.notifications);
    auditLogs.splice(0, auditLogs.length, ...normalized.auditLogs);
    Object.keys(trackingByCode).forEach(k => delete trackingByCode[k]);
    Object.assign(trackingByCode, normalized.trackingByCode);
    Object.keys(settings).forEach(k => delete settings[k]);
    Object.assign(settings, normalized.settings);
}

async function saveToDatabase(snapshot) {
    if (!pool) return;
    await pool.query(
        `INSERT INTO pure_herbs_state (id, state, updated_at)
         VALUES (1, $1::jsonb, NOW())
         ON CONFLICT (id) DO UPDATE
         SET state = EXCLUDED.state, updated_at = NOW()`,
        [JSON.stringify(snapshot)]
    );
}

function queueDatabaseSave() {
    if (!pool || !persistenceReady) return;
    const snapshot = getStateSnapshot();
    dbWriteQueue = dbWriteQueue
        .then(() => saveToDatabase(snapshot))
        .catch(error => {
            console.error("PostgreSQL persistence failed:", error.message);
        });
}

const data = loadData();

const orders = data.orders;
const trackingByCode = data.trackingByCode;
const customers = data.customers;
const registeredUsers = data.registeredUsers;
const products = data.products;
const statusHistory = data.statusHistory;
const qcTests = data.qcTests;
const documents = data.documents;
const shipments = data.shipments;
const notifications = data.notifications;
const auditLogs = data.auditLogs;
const settings = data.settings;

function getOrder(id) {

    return orders.find(
        order =>
            order.id.toLowerCase() ===
            String(id).toLowerCase()
    );
}

function getTracking(code) {

    return trackingByCode[
        String(code).toUpperCase()
    ] || null;
}

// Every create/update/delete operation calls persist(), so data survives
// page refreshes and backend restarts. Deletion is only performed by an
// explicit DELETE operation; there is no automatic cleanup.
function persist() {
    saveData({
        orders,
        trackingByCode,
        customers,
        registeredUsers,
        products,
        statusHistory,
        qcTests,
        documents,
        shipments,
        notifications,
        auditLogs,
        settings
    });
    queueDatabaseSave();
}

function addOrder(input) {
    const raw = input && typeof input === "object" ? input : {};

    const id = String(raw.id || "").trim().toUpperCase();
    if (!id) throw new Error("Order number is required.");
    if (getOrder(id)) throw new Error("An order with this number already exists.");

    const status = String(raw.status || "Order Confirmed").trim();
    const progress = STATUS_PROGRESS[status] ?? {
        "Order Confirmed": 12, "Production": 34, "Quality Control": 50,
        "Ready in Warehouse": 66, "Shipped": 82, "In Transit": 92,
        "Delivered": 100, "Delayed": 45, "Cancelled": 0
    }[status] ?? 0;

    // Persist every field received from the form/API, not only the original
    // small set of fields. This keeps future fields after refresh/restart.
    const order = {
        ...raw,
        id,
        customer: String(raw.customer || "").trim(),
        product: String(raw.product || "").trim(),
        latin: String(raw.latin || "").trim(),
        qty: String(raw.qty || "").trim(),
        status,
        dest: String(raw.dest || "").trim(),
        expected: String(raw.expected || "").trim(),
        trackingCode: String(raw.trackingCode || id).trim().toUpperCase(),
        progress,
        updated: new Date().toLocaleString("en-GB", {
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
        })
    };

    orders.unshift(order);

    const trackingCode = order.trackingCode;
    trackingByCode[trackingCode] = {
        code: trackingCode,
        orderId: id,
        status: status === "Order Confirmed" ? "Confirmed" : status,
        pct: order.progress,
        destination: order.dest,
        updated: order.updated,
        message: `Shipment ${id} is currently ${status}.`
    };

    persist();
    return order;
}

function addCustomer(input) {

    const name =
        String(input.name || "").trim();

    const email =
        String(input.email || "")
            .trim()
            .toLowerCase();

    if (!name || !email) {
        throw new Error(
            "Customer name and email are required."
        );
    }

    if (
        customers.some(
            customer =>
                customer.email.toLowerCase() === email
        )
    ) {
        throw new Error(
            "A customer with this email already exists."
        );
    }

    const customer = {
        id: "CUS-" + Date.now(),
        name,
        email,
        country:
            String(input.country || "").trim(),
        status: "Active"
    };

    customers.push(customer);
    persist();

    return customer;
}

function addProduct(input) {

    const name =
        String(input.name || "").trim();

    if (!name) {
        throw new Error(
            "Product name is required."
        );
    }

    if (
        products.some(
            product =>
                product.name.toLowerCase() ===
                name.toLowerCase()
        )
    ) {
        throw new Error(
            "This product already exists."
        );
    }

    const product = {
        name,
        latin:
            String(input.latin || "").trim(),
        category:
            String(input.category || "").trim(),
        available: true
    };

    products.push(product);
    persist();

    return product;
}

function getOrderAdvanced(id) {
    const key = String(id).toLowerCase();
    return {
        history: statusHistory.filter(x => String(x.orderId).toLowerCase() === key),
        qc: qcTests.filter(x => String(x.orderId).toLowerCase() === key),
        documents: documents.filter(x => String(x.orderId).toLowerCase() === key),
        shipment: shipments.find(x => String(x.orderId).toLowerCase() === key) || null,
        delay: (orders.find(o => String(o.id).toLowerCase() === key) || {}).delay || null
    };
}
const STATUS_PROGRESS = {
    "Order Confirmed": 12,
    "Raw Material Preparation": 22,
    "Production": 34,
    "Quality Control": 50,
    "Approved": 58,
    "Ready in Warehouse": 66,
    "Loading": 73,
    "Shipped": 82,
    "In Transit": 92,
    "Delivered": 100,
    "Delayed": 45,
    "On Hold": 30,
    "Cancelled": 0
};

function addStatusUpdate(orderId, input) {
    const order = getOrder(orderId);
    if (!order) throw new Error("Order not found.");

    const previousStatus = order.status;
    const nextStatus = String(input.status || "").trim();
    if (!nextStatus) throw new Error("Status is required.");
    if (!Object.prototype.hasOwnProperty.call(STATUS_PROGRESS, nextStatus)) {
        throw new Error("Invalid order status.");
    }

    const now = new Date().toISOString();
    order.status = nextStatus;
    order.progress = STATUS_PROGRESS[nextStatus];
    order.updated = new Date().toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });

    statusHistory.push({
        id: "H-" + Date.now(),
        orderId: order.id,
        status: nextStatus,
        date: now,
        by: String(input.by || "Admin"),
        note: String(input.note || "")
    });

    const tracking = Object.values(trackingByCode).find(t =>
        String(t.orderId || "").toLowerCase() === String(order.id).toLowerCase()
    );
    if (tracking) {
        tracking.status = nextStatus;
        tracking.pct = STATUS_PROGRESS[nextStatus];
        tracking.destination = order.dest;
        tracking.updated = order.updated;
        tracking.message = input.customerMessage || `Shipment ${order.id} is currently ${nextStatus}.`;
    }

    auditLogs.push({
        id: "A-" + Date.now(),
        date: now,
        user: String(input.by || "Admin"),
        action: "Status Updated",
        order: order.id,
        previousStatus,
        newStatus: nextStatus,
        details: String(input.note || "")
    });

    if (input.notify) {
        notifications.push({
            id: "N-" + Date.now(),
            date: now,
            order: order.id,
            message: String(input.customerMessage || `Your order has been updated to ${nextStatus}.`),
            enabled: true
        });
    }

    persist();
    return order;
}
function addQcTest(orderId, input) {
    if (!getOrder(orderId)) throw new Error("Order not found.");
    const item = { id:"QC-"+Date.now(), orderId, test:input.test||"", result:input.result||"", spec:input.spec||"", unit:input.unit||"", status:input.status||"PENDING", date:input.date||new Date().toLocaleDateString("en-US") , customerVisible: input.customerVisible !== false };
    qcTests.push(item); auditLogs.push({id:"A-"+Date.now(),date:new Date().toISOString(),user:input.by||"Quality",action:"QC Result Added",order:orderId,details:item.test}); persist(); return item;
}
function addDocument(input) {
    if (!getOrder(input.orderId)) throw new Error("Order not found.");
    const item={id:"DOC-"+Date.now(),orderId:input.orderId,name:input.name||"Other Document",version:input.version||"v1",date:input.date||new Date().toLocaleDateString("en-US"),visibility:input.visibility||"internal",fileName:input.fileName||""};
    documents.push(item); auditLogs.push({id:"A-"+Date.now(),date:new Date().toISOString(),user:input.by||"Admin",action:"Document Added",order:input.orderId,details:`${item.name} · ${item.visibility}`}); persist(); return item;
}
function addShipment(input) {
    if (!getOrder(input.orderId)) throw new Error("Order not found.");
    const item={id:"SHP-"+Date.now(),...input};
    const idx=shipments.findIndex(x=>x.orderId===input.orderId); if(idx>=0) shipments[idx]=item; else shipments.push(item);
    auditLogs.push({id:"A-"+Date.now(),date:new Date().toISOString(),user:input.by||"Shipping",action:"Shipment Updated",order:input.orderId,details:item.container||item.vessel||"Shipment details"}); persist(); return item;
}
function addDelay(orderId, input) {
    const order=getOrder(orderId); if(!order) throw new Error("Order not found.");
    order.status="Delayed"; order.progress=STATUS_PROGRESS.Delayed; order.updated=new Date().toLocaleString("en-GB", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}); order.delay={reason:input.reason||"",newExpectedDate:input.newExpectedDate||"",internalNote:input.internalNote||"",customerMessage:input.customerMessage||""};
    statusHistory.push({id:"H-"+Date.now(),orderId:order.id,status:"Delayed",date:new Date().toISOString(),by:input.by||"Admin",note:input.internalNote||""});
    const tracking = Object.values(trackingByCode).find(t => String(t.orderId||"").toLowerCase() === String(order.id).toLowerCase()); if(tracking){ tracking.status="Delayed"; tracking.pct=STATUS_PROGRESS.Delayed; tracking.updated=order.updated; tracking.message=order.delay.customerMessage || `Shipment ${order.id} is delayed.`; } auditLogs.push({id:"A-"+Date.now(),date:new Date().toISOString(),user:input.by||"Admin",action:"Order Delayed",order:order.id,details:input.reason||""}); persist(); return order;
}


function updateOrder(id, input) {
    const order = getOrder(id);
    if (!order) throw new Error("Order not found.");

    const oldId = order.id;
    const nextId = String(input.id || oldId).trim().toUpperCase();
    if (nextId !== oldId && getOrder(nextId)) {
        throw new Error("An order with this number already exists.");
    }

    const oldTrackingCode = String(order.trackingCode || oldId).toUpperCase();
    const nextTrackingCode = String(
        input.trackingCode ?? order.trackingCode ?? nextId
    ).trim().toUpperCase() || nextId;

    // Preserve existing fields and save all fields supplied by the edit form.
    Object.assign(order, input || {}, {
        id: nextId,
        customer: String(input.customer ?? order.customer).trim(),
        product: String(input.product ?? order.product).trim(),
        latin: String(input.latin ?? order.latin).trim(),
        qty: String(input.qty ?? order.qty).trim(),
        dest: String(input.dest ?? order.dest).trim(),
        expected: String(input.expected ?? order.expected).trim(),
        trackingCode: nextTrackingCode
    });

    if (input.status && input.status !== order.status) {
        order.status = String(input.status);
        order.progress = STATUS_PROGRESS[order.status] ?? order.progress;
    }

    order.updated = new Date().toLocaleString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });

    if (oldTrackingCode !== nextTrackingCode) delete trackingByCode[oldTrackingCode];

    trackingByCode[nextTrackingCode] = {
        ...(trackingByCode[nextTrackingCode] || {}),
        code: nextTrackingCode,
        orderId: nextId,
        destination: order.dest,
        status: order.status === "Order Confirmed" ? "Confirmed" : order.status,
        pct: order.progress,
        updated: order.updated,
        message: `Shipment ${nextId} is currently ${order.status}.`
    };

    statusHistory.forEach(h => {
        if (String(h.orderId).toLowerCase() === oldId.toLowerCase()) h.orderId = nextId;
    });
    qcTests.forEach(x => {
        if (String(x.orderId).toLowerCase() === oldId.toLowerCase()) x.orderId = nextId;
    });
    documents.forEach(x => {
        if (String(x.orderId).toLowerCase() === oldId.toLowerCase()) x.orderId = nextId;
    });
    shipments.forEach(x => {
        if (String(x.orderId).toLowerCase() === oldId.toLowerCase()) x.orderId = nextId;
    });

    persist();
    return order;
}

function deleteOrder(id) {
    const idx = orders.findIndex(o => String(o.id).toLowerCase() === String(id).toLowerCase());
    if (idx < 0) throw new Error("Order not found.");
    const orderId = orders[idx].id;
    orders.splice(idx,1);
    Object.keys(trackingByCode).forEach(code => { if (String(trackingByCode[code].orderId).toLowerCase() === orderId.toLowerCase()) delete trackingByCode[code]; });
    [statusHistory,qcTests,documents,shipments].forEach(arr => { for (let i=arr.length-1;i>=0;i--) if (String(arr[i].orderId).toLowerCase() === orderId.toLowerCase()) arr.splice(i,1); });
    auditLogs.push({id:"A-"+Date.now(),date:new Date().toISOString(),user:"Admin",action:"Order Deleted",order:orderId,details:"Order removed from the system"});
    persist(); return {id: orderId};
}
function updateCustomer(id, input) {
    const customer = customers.find(c => c.id === id); if (!customer) throw new Error("Customer not found.");
    const email = String(input.email ?? customer.email).trim().toLowerCase();
    if (customers.some(c => c.id !== id && c.email.toLowerCase() === email)) throw new Error("A customer with this email already exists.");
    Object.assign(customer, {name:String(input.name ?? customer.name).trim(), email, country:String(input.country ?? customer.country).trim(), status:String((input.status ?? customer.status) || "Active")});
    persist(); return customer;
}
function deleteCustomer(id) {
    const idx = customers.findIndex(c => c.id === id); if (idx < 0) throw new Error("Customer not found.");
    const customer = customers[idx]; customers.splice(idx,1); persist(); return customer;
}
function updateProduct(name, input) {
    const product = products.find(p => p.name.toLowerCase() === String(name).toLowerCase()); if (!product) throw new Error("Product not found.");
    const nextName = String(input.name ?? product.name).trim();
    if (products.some(p => p !== product && p.name.toLowerCase() === nextName.toLowerCase())) throw new Error("This product already exists.");
    Object.assign(product,{name:nextName,latin:String(input.latin ?? product.latin).trim(),category:String(input.category ?? product.category).trim(),available:input.available !== undefined ? Boolean(input.available) : product.available});
    persist(); return product;
}
function deleteProduct(name) { const idx=products.findIndex(p=>p.name.toLowerCase()===String(name).toLowerCase()); if(idx<0) throw new Error("Product not found."); const p=products[idx]; products.splice(idx,1); persist(); return p; }
function updateById(collection, id, input) { const item=collection.find(x=>x.id===id); if(!item) throw new Error("Record not found."); Object.assign(item,input,{id:item.id}); persist(); return item; }
function deleteById(collection, id) { const idx=collection.findIndex(x=>x.id===id); if(idx<0) throw new Error("Record not found."); const item=collection[idx]; collection.splice(idx,1); persist(); return item; }


function hashUserPassword(password) {
    return crypto.createHash("sha256").update(String(password)).digest("hex");
}

function sanitizeRegisteredUser(user) {
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
}

function registerUser(input) {
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");
    if (!name) throw new Error("Name is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email.");
    if (password.length < 8) throw new Error("Password must be at least 8 characters.");
    if (email === "demo@pureherbs.com") throw new Error("This email is reserved.");
    if (registeredUsers.some(u => u.email.toLowerCase() === email)) throw new Error("An account already exists with this email.");
    const user = {
        id: "USR-" + Date.now(),
        name, email,
        passwordHash: hashUserPassword(password),
        createdAt: new Date().toISOString(),
        lastLogin: null,
        loginCount: 0,
        status: "Active"
    };
    registeredUsers.push(user);
    persist();
    return sanitizeRegisteredUser(user);
}

function authenticateUser(email, password) {
    const normalized = String(email || "").trim().toLowerCase();
    const user = registeredUsers.find(u => u.email.toLowerCase() === normalized);
    if (!user || user.status === "Inactive" || user.passwordHash !== hashUserPassword(password)) {
        throw new Error("Account not found or password is incorrect.");
    }
    user.lastLogin = new Date().toISOString();
    user.loginCount = Number(user.loginCount || 0) + 1;
    persist();
    return sanitizeRegisteredUser(user);
}

function resetUserPassword(email, password) {
    const normalized = String(email || "").trim().toLowerCase();
    const user = registeredUsers.find(u => u.email.toLowerCase() === normalized);
    if (!user) throw new Error("No customer account was found with this email.");
    if (String(password || "").length < 8) throw new Error("Password must be at least 8 characters.");
    user.passwordHash = hashUserPassword(password);
    persist();
    return sanitizeRegisteredUser(user);
}

module.exports = {
    orders,
    trackingByCode,
    customers,
    registeredUsers,
    products,
    getOrder,
    getTracking,
    addOrder, updateOrder, deleteOrder,
    addCustomer, updateCustomer, deleteCustomer,
    addProduct, updateProduct, deleteProduct,
    updateById, deleteById,
    getOrderAdvanced, addStatusUpdate, addQcTest, addDocument, addShipment, addDelay,
    statusHistory, qcTests, documents, shipments, notifications, auditLogs, settings, persist,
    registerUser, authenticateUser, resetUserPassword, sanitizeRegisteredUser, initPersistence
};
