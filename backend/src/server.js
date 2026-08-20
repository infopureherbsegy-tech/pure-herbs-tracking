const path = require("path");
const express = require("express");

const {
    orders,
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
} = require("./store");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

const frontendPath =
    path.join(__dirname, "..", "..", "frontend");

app.use(express.static(frontendPath, {
    maxAge: 0,
    etag: false,
    setHeaders: (res) => {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
    }
}));

app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        service: "Pure Herbs Tracking API"
    });
});

app.get("/api/orders", (req, res) => {
    res.json({
        orders
    });
});

app.post("/api/orders", (req, res) => {

    try {

        const order =
            addOrder(req.body || {});

        res.status(201).json({
            order
        });

    } catch (error) {

        res.status(400).json({
            message:
                error.message ||
                "Could not create order."
        });
    }
});

app.get("/api/orders/:id", (req, res) => {

    const order =
        getOrder(req.params.id);

    if (!order) {
        return res.status(404).json({
            message: "Order not found"
        });
    }

    res.json({
        order
    });
});

app.get(
    "/api/orders/:id/documents/:type",
    (req, res) => {

        const order =
            getOrder(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const allowed = [
            "commercial-invoice",
            "packing-list",
            "quality-certificate"
        ];

        const type =
            String(req.params.type);

        if (!allowed.includes(type)) {
            return res.status(404).json({
                message: "Document type not found"
            });
        }

        const titleMap = {
            "commercial-invoice": "Commercial Invoice",
            "packing-list": "Packing List",
            "quality-certificate": "Quality Certificate"
        };

        const title =
            titleMap[type];

        const escapeHtml = value =>
            String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;");

        let details = "";

        if (type === "commercial-invoice") {

            details = `
                <tr><th>Invoice Number</th><td>${escapeHtml(order.invoiceNumber || "—")}</td></tr>
                <tr><th>Invoice Date</th><td>${escapeHtml(order.invoiceDate || new Date().toLocaleDateString())}</td></tr>
                <tr><th>Customer</th><td>${escapeHtml(order.customer)}</td></tr>
                <tr><th>Product</th><td>${escapeHtml(order.product)} — ${escapeHtml(order.latin)}</td></tr>
                <tr><th>Quantity</th><td>${escapeHtml(order.qty)}</td></tr>
                <tr><th>Destination</th><td>${escapeHtml(order.dest)}</td></tr>
                <tr><th>Origin</th><td>${escapeHtml(order.origin || "Egypt")}</td></tr>
                <tr><th>HS Code</th><td>${escapeHtml(order.hsCode || "—")}</td></tr>
            `;

        } else if (type === "packing-list") {

            details = `
                <tr><th>Order</th><td>${escapeHtml(order.id)}</td></tr>
                <tr><th>Product</th><td>${escapeHtml(order.product)}</td></tr>
                <tr><th>Quantity</th><td>${escapeHtml(order.qty)}</td></tr>
                <tr><th>Packing</th><td>${escapeHtml(order.packing || "—")}</td></tr>
                <tr><th>Gross Weight</th><td>${escapeHtml(order.totalGrossWeight || order.qty)}</td></tr>
                <tr><th>Origin</th><td>${escapeHtml(order.origin || "Egypt")}</td></tr>
                <tr><th>Destination</th><td>${escapeHtml(order.dest)}</td></tr>
            `;

        } else {

            details = `
                <tr><th>Order</th><td>${escapeHtml(order.id)}</td></tr>
                <tr><th>Product</th><td>${escapeHtml(order.product)} — ${escapeHtml(order.latin)}</td></tr>
                <tr><th>Lot Number</th><td>${escapeHtml(order.lotNumber || "—")}</td></tr>
                <tr><th>Origin</th><td>${escapeHtml(order.origin || "Egypt")}</td></tr>
                <tr><th>Current Status</th><td>${escapeHtml(order.status)}</td></tr>
                <tr><th>Quality Certificate</th><td>Ready</td></tr>
            `;
        }

        const documentHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)} - ${escapeHtml(order.id)}</title>
<style>
body{font-family:Arial,sans-serif;margin:48px;color:#183529}
header{border-bottom:3px solid #2b7a5b;padding-bottom:18px;margin-bottom:28px}
h1{margin:0 0 8px;font-size:28px}
p{color:#6d7b73}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:13px;border-bottom:1px solid #dfe7e1}
th{width:34%;background:#f4f6f2}
.footer{margin-top:36px;font-size:12px;color:#7a857f}
</style>
</head>
<body>
<header>
<h1>Pure Herbs</h1>
<p>${escapeHtml(title)}</p>
</header>
<h2>${escapeHtml(order.id)}</h2>
<table>${details}</table>
<div class="footer">
Generated from Pure Herbs Shipment Portal · ${escapeHtml(new Date().toLocaleString())}
</div>
</body>
</html>`;

        const filename =
            `${type}-${order.id}.html`;

        res.setHeader(
            "Content-Type",
            "text/html; charset=utf-8"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${filename}"`
        );

        res.send(documentHtml);
    }
);


app.put("/api/orders/:id", (req,res)=>{try{res.json({order:updateOrder(req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.delete("/api/orders/:id", (req,res)=>{try{res.json(deleteOrder(req.params.id));}catch(e){res.status(400).json({message:e.message});}});
app.get("/api/orders/:id/advanced", (req,res)=>{ const o=getOrderAdvanced(req.params.id); res.json(o); });
app.get("/api/orders/:id/history", (req,res)=>res.json({history: getOrderAdvanced(req.params.id).history}));
app.post("/api/orders/:id/status", (req,res)=>{try{res.status(201).json({order:addStatusUpdate(req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.post("/api/orders/:id/qc", (req,res)=>{try{res.status(201).json({qc:addQcTest(req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.get("/api/qc", (req,res)=>res.json({qc:qcTests}));
app.get("/api/documents", (req,res)=>res.json({documents}));
app.post("/api/documents", (req,res)=>{try{res.status(201).json({document:addDocument(req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.get("/api/shipments", (req,res)=>res.json({shipments}));
app.post("/api/shipments", (req,res)=>{try{res.status(201).json({shipment:addShipment(req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.put("/api/qc/:id",(req,res)=>{try{res.json({qc:updateById(qcTests,req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.delete("/api/qc/:id",(req,res)=>{try{res.json({qc:deleteById(qcTests,req.params.id)});}catch(e){res.status(404).json({message:e.message});}});
app.put("/api/documents/:id",(req,res)=>{try{res.json({document:updateById(documents,req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.delete("/api/documents/:id",(req,res)=>{try{res.json({document:deleteById(documents,req.params.id)});}catch(e){res.status(404).json({message:e.message});}});
app.put("/api/shipments/:id",(req,res)=>{try{res.json({shipment:updateById(shipments,req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.delete("/api/shipments/:id",(req,res)=>{try{res.json({shipment:deleteById(shipments,req.params.id)});}catch(e){res.status(404).json({message:e.message});}});
app.put("/api/notifications/:id",(req,res)=>{try{res.json({notification:updateById(notifications,req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.delete("/api/notifications/:id",(req,res)=>{try{res.json({notification:deleteById(notifications,req.params.id)});}catch(e){res.status(404).json({message:e.message});}});
app.post("/api/orders/:id/delay", (req,res)=>{try{res.status(201).json({order:addDelay(req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.get("/api/audit", (req,res)=>res.json({audit:auditLogs}));
app.get("/api/notifications", (req,res)=>res.json({notifications}));
app.post("/api/notifications", (req,res)=>{const n={id:"N-"+Date.now(),date:new Date().toISOString(),...req.body};notifications.push(n);auditLogs.push({id:"A-"+Date.now(),date:new Date().toISOString(),user:req.body.by||"Admin",action:"Notification Created",order:req.body.order||"",details:n.message||""});persist();res.status(201).json({notification:n});});
app.get("/api/settings", (req,res)=>res.json({settings}));
app.put("/api/settings", (req,res)=>{Object.assign(settings,req.body||{});persist();res.json({settings});});

app.get("/api/tracking/:code", (req, res) => {

    const tracking =
        getTracking(req.params.code);

    if (!tracking) {
        return res.status(404).json({
            message: "Tracking number not found"
        });
    }

    res.json(tracking);
});


app.post("/api/auth/register", (req, res) => {
    try { res.status(201).json({ user: registerUser(req.body || {}) }); }
    catch (error) { res.status(400).json({ message: error.message || "Could not create account." }); }
});

app.post("/api/auth/login", (req, res) => {
    try { res.json({ user: authenticateUser(req.body?.email, req.body?.password) }); }
    catch (error) { res.status(401).json({ message: error.message || "Invalid account credentials." }); }
});

app.put("/api/auth/password", (req, res) => {
    try { res.json({ user: resetUserPassword(req.body?.email, req.body?.password) }); }
    catch (error) { res.status(400).json({ message: error.message || "Could not reset password." }); }
});

app.get("/api/registered-users", (req, res) => {
    res.json({ users: registeredUsers.map(sanitizeRegisteredUser) });
});

app.get("/api/customers", (req, res) => {
    res.json({
        customers
    });
});

app.post("/api/customers", (req, res) => {

    try {

        const customer =
            addCustomer(req.body || {});

        res.status(201).json({
            customer
        });

    } catch (error) {

        res.status(400).json({
            message:
                error.message ||
                "Could not create customer."
        });
    }
});

app.get("/api/products", (req, res) => {
    res.json({
        products
    });
});

app.post("/api/products", (req, res) => {

    try {

        const product =
            addProduct(req.body || {});

        res.status(201).json({
            product
        });

    } catch (error) {

        res.status(400).json({
            message:
                error.message ||
                "Could not create product."
        });
    }
});


app.put("/api/customers/:id", (req,res)=>{try{res.json({customer:updateCustomer(req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.delete("/api/customers/:id", (req,res)=>{try{res.json({customer:deleteCustomer(req.params.id)});}catch(e){res.status(400).json({message:e.message});}});
app.put("/api/products/:name", (req,res)=>{try{res.json({product:updateProduct(decodeURIComponent(req.params.name),req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.delete("/api/products/:name", (req,res)=>{try{res.json({product:deleteProduct(decodeURIComponent(req.params.name))});}catch(e){res.status(400).json({message:e.message});}});
app.put("/api/qc/:id", (req,res)=>{try{res.json({qc:updateById(qcTests,req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.delete("/api/qc/:id", (req,res)=>{try{res.json({qc:deleteById(qcTests,req.params.id)});}catch(e){res.status(400).json({message:e.message});}});
app.put("/api/documents/:id", (req,res)=>{try{res.json({document:updateById(documents,req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.delete("/api/documents/:id", (req,res)=>{try{res.json({document:deleteById(documents,req.params.id)});}catch(e){res.status(400).json({message:e.message});}});
app.put("/api/shipments/:id", (req,res)=>{try{res.json({shipment:updateById(shipments,req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.delete("/api/shipments/:id", (req,res)=>{try{res.json({shipment:deleteById(shipments,req.params.id)});}catch(e){res.status(400).json({message:e.message});}});
app.put("/api/notifications/:id", (req,res)=>{try{res.json({notification:updateById(notifications,req.params.id,req.body||{})});}catch(e){res.status(400).json({message:e.message});}});
app.delete("/api/notifications/:id", (req,res)=>{try{res.json({notification:deleteById(notifications,req.params.id)});}catch(e){res.status(400).json({message:e.message});}});

app.use((req, res) => {
    res.sendFile(
        path.join(
            frontendPath,
            "index.html"
        )
    );
});

async function startServer() {
    try {
        await initPersistence();
        app.listen(PORT, () => {
            console.log(`Pure Herbs API running on http://localhost:${PORT}`);
            console.log(process.env.DATABASE_URL ? "Persistence: PostgreSQL" : "Persistence: local data.json");
        });
    } catch (error) {
        console.error("Persistence initialization failed:", error);
        process.exit(1);
    }
}

startServer();
