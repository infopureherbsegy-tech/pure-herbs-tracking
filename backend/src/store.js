const fs = require("fs");
const path = require("path");

const dataPath =
    path.join(__dirname, "data.json");

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

        console.error(
            "Could not read data.json. Recreating it."
        );

        const fresh =
            cloneDefault();

        saveData(fresh);

        return fresh;
    }
}

function saveData(data) {

    fs.writeFileSync(
        dataPath,
        JSON.stringify(
            data,
            null,
            2
        ),
        "utf8"
    );
}

const data = loadData();

const orders = data.orders;
const trackingByCode = data.trackingByCode;
const customers = data.customers;
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

function persist() {

    saveData({
        orders,
        trackingByCode,
        customers,
        products,
        statusHistory,
        qcTests,
        documents,
        shipments,
        notifications,
        auditLogs,
        settings
    });
}

function addOrder(input) {

    const id =
        String(input.id || "").trim().toUpperCase();

    if (!id) {
        throw new Error("Order number is required.");
    }

    if (getOrder(id)) {
        throw new Error("An order with this number already exists.");
    }

    const status =
        input.status || "Order Confirmed";

    const progressMap = {
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

    const order = {
        id,
        customer: input.customer || "",
        product: input.product || "",
        latin: input.latin || "",
        qty: input.qty || "",
        status,
        dest: input.dest || "",
        expected: input.expected || "",
        progress: progressMap[status] ?? 0,
        updated: new Date().toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        })
    };

    orders.unshift(order);

    const trackingCode =
        String(
            input.trackingCode || id
        ).trim().toUpperCase();

    trackingByCode[trackingCode] = {
        code: trackingCode,
        orderId: id,
        status:
            status === "Order Confirmed"
                ? "Confirmed"
                : status,
        pct: order.progress,
        destination: order.dest,
        updated: order.updated,
        message:
            `Shipment ${id} is currently ${status}.`
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
    if (nextId !== oldId && getOrder(nextId)) throw new Error("An order with this number already exists.");
    Object.assign(order, {
        id: nextId,
        customer: String(input.customer ?? order.customer).trim(),
        product: String(input.product ?? order.product).trim(),
        latin: String(input.latin ?? order.latin).trim(),
        qty: String(input.qty ?? order.qty).trim(),
        dest: String(input.dest ?? order.dest).trim(),
        expected: String(input.expected ?? order.expected).trim()
    });
    if (input.status && input.status !== order.status) {
        order.status = String(input.status);
        order.progress = STATUS_PROGRESS[order.status] ?? order.progress;
    }
    order.updated = new Date().toLocaleString("en-GB", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
    Object.values(trackingByCode).forEach(t => { if (String(t.orderId).toLowerCase() === oldId.toLowerCase()) { t.orderId = nextId; t.destination = order.dest; t.status = order.status; t.pct = order.progress; t.updated = order.updated; }});
    statusHistory.forEach(h => { if (String(h.orderId).toLowerCase() === oldId.toLowerCase()) h.orderId = nextId; });
    qcTests.forEach(x => { if (String(x.orderId).toLowerCase() === oldId.toLowerCase()) x.orderId = nextId; });
    documents.forEach(x => { if (String(x.orderId).toLowerCase() === oldId.toLowerCase()) x.orderId = nextId; });
    shipments.forEach(x => { if (String(x.orderId).toLowerCase() === oldId.toLowerCase()) x.orderId = nextId; });
    persist(); return order;
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

module.exports = {
    orders,
    trackingByCode,
    customers,
    products,
    getOrder,
    getTracking,
    addOrder, updateOrder, deleteOrder,
    addCustomer, updateCustomer, deleteCustomer,
    addProduct, updateProduct, deleteProduct,
    updateById, deleteById,
    getOrderAdvanced, addStatusUpdate, addQcTest, addDocument, addShipment, addDelay,
    statusHistory, qcTests, documents, shipments, notifications, auditLogs, settings, persist
};
