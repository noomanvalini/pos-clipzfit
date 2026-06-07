require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. Initialize Firebase Admin SDK
let db = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    console.log("Firebase initialized successfully via environment variable.");
  } catch (err) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:", err);
  }
} else {
  const keyPath = path.join(__dirname, 'firebase-key.json');
  if (fs.existsSync(keyPath)) {
    try {
      const serviceAccount = require(keyPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      db = admin.firestore();
      console.log("Firebase initialized successfully via local firebase-key.json.");
    } catch (err) {
      console.error("Failed to load local firebase-key.json:", err);
    }
  } else {
    console.warn("WARNING: No Firebase credentials found! Please set FIREBASE_SERVICE_ACCOUNT or add server/firebase-key.json.");
  }
}

// Initial seeding data
const initialData = {
  products: [
    {
      id: "prod-1",
      name: "Whey Isolate Pro",
      price: 45.00,
      promoPrice: null,
      category: "Proteínas",
      sku: "WHEY-ISO-PRO-1",
      generalStock: 100,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCfMPSqad29wDPlzWUlkhJj81FCvmX5-eXKrFdm6lBZXYlT1BNEWL4dDrzwd8FyokdWRdpG75hU0lo9ez4nq-9tbB1uDWi-cE9DisVnIQl9UkIAy9-06doqDLmHoJUvFGwTEBcYU8SJC1vs4ovt6PDLQk_6hVPKgNZgFuOIDcpjxIKQ-hBJXGZOwOwk4z8O4hGGJhU3HO8VLdLkyWFD9WOlzN7qfaK8A51HU3H3gBqicribW7nNNZHeEUPxWh3vp7HvOXAZu80J7faI",
      type: "image"
    },
    {
      id: "prod-2",
      name: "Pre-Workout Xtreme",
      price: 32.50,
      promoPrice: null,
      category: "Pré-treinos",
      sku: "PRE-WORK-XT-1",
      generalStock: 100,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6zp1m0c_XtPmvcfA3gpHG-gev29iVfDkBfzVC9MQLW6nPNWdkrGhaJ96rpjK4bqzBscc9D4-oUJjmFGAhTanBf12e0drRDJzw0f943EMgwhMnfzJZD17t1XyGBnJVlAhy8j-ikZYQbFMAncDg0d2QLedKRPVkXoTXUUG7XDeXKaiM6aRHO7IH1WS6rxheQtYnycS-uILp5cpd0SKE2F3CYzowQRfPAlpLyOUsvX8JpZhEW1-lj8p3FOj8ln86Djq6TLxorIheZSw2",
      type: "image"
    },
    {
      id: "prod-3",
      name: "BCAA Recovery",
      price: 28.00,
      promoPrice: null,
      category: "Recuperação",
      sku: "BCAA-REC-1",
      generalStock: 100,
      image: "medication", 
      type: "icon"
    }
  ],
  affiliates: [
    {
      id: "AFF-1001",
      name: "ClipzFIT Centro",
      location: "São Paulo - SP",
      commissionRate: 15,
      totalSales: 0.00,
      commissionBalance: 0.00,
      status: "Active",
      email: "centro@clipzfit.com",
      password: "password123"
    },
    {
      id: "AFF-1002",
      name: "ClipzFIT Barra",
      location: "Rio de Janeiro - RJ",
      commissionRate: 12,
      totalSales: 0.00,
      commissionBalance: 0.00,
      status: "Active",
      email: "barra@clipzfit.com",
      password: "password123"
    },
    {
      id: "AFF-1003",
      name: "ClipzFIT Savassi",
      location: "Belo Horizonte - MG",
      commissionRate: 15,
      totalSales: 0.00,
      commissionBalance: 0.00,
      status: "Inactive",
      email: "savassi@clipzfit.com",
      password: "password123"
    }
  ],
  stocks: {
    "AFF-1001": {
      "prod-1": 15,
      "prod-2": 4, 
      "prod-3": 25
    },
    "AFF-1002": {
      "prod-1": 10,
      "prod-2": 5,
      "prod-3": 12
    },
    "AFF-1003": {
      "prod-1": 0,
      "prod-2": 0,
      "prod-3": 0
    }
  },
  notifications: [
    {
      id: "NT-9999",
      title: "Notificação Inicial",
      message: "Bem-vindo ao sistema de controle de vendas e estoque do ClipzFIT.",
      date: new Date().toISOString(),
      read: false
    }
  ]
};

// Seeding Firestore if empty
async function seedDatabaseIfEmpty() {
  if (!db) return;
  try {
    const productsSnap = await db.collection('products').limit(1).get();
    if (productsSnap.empty) {
      console.log("Firestore database is empty. Seeding initial data...");
      
      // 1. Seed products
      for (const prod of initialData.products) {
        await db.collection('products').doc(prod.id).set(prod);
      }
      
      // 2. Seed affiliates
      for (const aff of initialData.affiliates) {
        await db.collection('affiliates').doc(aff.id).set(aff);
      }
      
      // 3. Seed stocks
      for (const affId in initialData.stocks) {
        for (const prodId in initialData.stocks[affId]) {
          const qty = initialData.stocks[affId][prodId];
          const stockDocId = `${affId}_${prodId}`;
          await db.collection('stocks').doc(stockDocId).set({
            affiliateId: affId,
            productId: prodId,
            quantity: qty
          });
        }
      }
      
      // 4. Seed notifications
      for (const notif of initialData.notifications) {
        await db.collection('notifications').doc(notif.id).set(notif);
      }

      console.log("Database seeding completed successfully!");
    } else {
      console.log("Firestore database already has data. Seeding skipped. Checking if existing products need schema update...");
      const allProds = await db.collection('products').get();
      for (const doc of allProds.docs) {
        const prod = doc.data();
        if (prod.generalStock === undefined || prod.category === undefined || prod.sku === undefined) {
          const defaults = initialData.products.find(p => p.id === doc.id);
          if (defaults) {
            console.log(`Patching product ${doc.id} with schema defaults...`);
            await doc.ref.update({
              sku: defaults.sku,
              category: defaults.category,
              generalStock: defaults.generalStock,
              promoPrice: defaults.promoPrice || null
            });
          }
        }
      }

      // Self-healing: Check and patch missing stock documents for all affiliates & products
      console.log("Checking for missing stock documents...");
      const allAffiliates = await db.collection('affiliates').get();
      const allStocksSnap = await db.collection('stocks').get();
      
      const existingStockIds = new Set();
      allStocksSnap.forEach(doc => {
        existingStockIds.add(doc.id);
      });

      let missingDocsCount = 0;
      for (const affDoc of allAffiliates.docs) {
        const affId = affDoc.id;
        for (const prodDoc of allProds.docs) {
          const prodId = prodDoc.id;
          const stockDocId = `${affId}_${prodId}`;
          
          if (!existingStockIds.has(stockDocId)) {
            console.log(`Self-healing: Creating missing stock doc for Affiliate ${affId} and Product ${prodId}...`);
            await db.collection('stocks').doc(stockDocId).set({
              affiliateId: affId,
              productId: prodId,
              quantity: 0
            });
            missingDocsCount++;
          }
        }
      }
      console.log(`Self-healing check completed. Created ${missingDocsCount} missing stock documents.`);
    }
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

// One-time cleanup script for fictive sales and reset affiliate totals
async function runOneTimeCleanup() {
  if (!db) return;
  try {
    const migrationRef = db.collection('system_settings').doc('migrations');
    const migrationDoc = await migrationRef.get();
    
    if (!migrationDoc.exists || !migrationDoc.data().fictiveCleanupV2) {
      console.log("Running one-time cleanup of fictive sales and resetting affiliate balances...");
      
      // 1. Delete all transactions
      const txsSnapshot = await db.collection('transactions').get();
      const txBatch = db.batch();
      txsSnapshot.forEach(doc => {
        txBatch.delete(doc.ref);
      });
      await txBatch.commit();
      console.log(`Deleted ${txsSnapshot.size} transactions.`);

      // 2. Delete all withdrawals
      const wdsSnapshot = await db.collection('withdrawals').get();
      const wdBatch = db.batch();
      wdsSnapshot.forEach(doc => {
        wdBatch.delete(doc.ref);
      });
      await wdBatch.commit();
      console.log(`Deleted ${wdsSnapshot.size} withdrawals.`);

      // 3. Reset totalSales and commissionBalance to 0 for all affiliates
      const affiliatesSnapshot = await db.collection('affiliates').get();
      const affBatch = db.batch();
      affiliatesSnapshot.forEach(doc => {
        affBatch.update(doc.ref, {
          totalSales: 0.00,
          commissionBalance: 0.00
        });
      });
      await affBatch.commit();
      console.log(`Reset metrics for ${affiliatesSnapshot.size} affiliates.`);

      // 4. Record migration completed
      await migrationRef.set({ fictiveCleanupV2: true }, { merge: true });
      console.log("One-time cleanup completed successfully!");
    } else {
      console.log("One-time cleanup migration already applied. Skipping.");
    }
  } catch (err) {
    console.error("Error executing one-time cleanup migration:", err);
  }
}

// Call Seeding and cleanup migrations
async function bootstrap() {
  await seedDatabaseIfEmpty();
  await runOneTimeCleanup();
}
bootstrap();

// Database connection check middleware
const checkDb = (req, res, next) => {
  if (!db) {
    return res.status(503).json({ error: "Banco de dados Firebase indisponível no momento." });
  }
  next();
};

app.use(checkDb);

// Routes

// 1. GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const snapshot = await db.collection('products').get();
    const list = [];
    snapshot.forEach(doc => {
      list.push(doc.data());
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products (Create Product)
app.post('/api/products', async (req, res) => {
  const { name, category, sku, price, promoPrice, generalStock, image } = req.body;

  if (!name || !category || !sku || price === undefined || generalStock === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios faltando: nome, categoria, SKU, preço e estoque geral CD." });
  }

  try {
    const skuQuery = await db.collection('products').where('sku', '==', sku).get();
    if (!skuQuery.empty) {
      return res.status(400).json({ error: "Já existe um produto cadastrado com este SKU." });
    }

    const productId = `prod-${Math.floor(1000 + Math.random() * 9000)}`;
    const newProduct = {
      id: productId,
      name,
      category,
      sku,
      price: Number(price),
      promoPrice: promoPrice ? Number(promoPrice) : null,
      generalStock: Number(generalStock),
      image: image && image.trim() !== "" ? image.trim() : "inventory",
      type: image && image.trim() !== "" ? "image" : "icon"
    };

    await db.collection('products').doc(productId).set(newProduct);

    // Initialize stock at 0 for all affiliates
    const affiliatesSnap = await db.collection('affiliates').get();
    for (const affDoc of affiliatesSnap.docs) {
      const affId = affDoc.id;
      await db.collection('stocks').doc(`${affId}_${productId}`).set({
        affiliateId: affId,
        productId: productId,
        quantity: 0
      });
    }

    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id (Edit Product)
app.put('/api/products/:id', async (req, res) => {
  const productId = req.params.id;
  const { name, category, sku, price, promoPrice, generalStock, image } = req.body;

  if (!name || !category || !sku || price === undefined || generalStock === undefined) {
    return res.status(400).json({ error: "Campos obrigatórios faltando: nome, categoria, SKU, preço e estoque geral CD." });
  }

  try {
    const prodDoc = await db.collection('products').doc(productId).get();
    if (!prodDoc.exists) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    // Check SKU duplicates
    const skuQuery = await db.collection('products').where('sku', '==', sku).get();
    let skuExists = false;
    skuQuery.forEach(doc => {
      if (doc.id !== productId) skuExists = true;
    });
    if (skuExists) {
      return res.status(400).json({ error: "Este SKU já está sendo utilizado por outro produto." });
    }

    const updatedProduct = {
      ...prodDoc.data(),
      name,
      category,
      sku,
      price: Number(price),
      promoPrice: promoPrice ? Number(promoPrice) : null,
      generalStock: Number(generalStock),
      image: image && image.trim() !== "" ? image.trim() : "inventory",
      type: image && image.trim() !== "" ? "image" : "icon"
    };

    await db.collection('products').doc(productId).set(updatedProduct);
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id (Delete Product)
app.delete('/api/products/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const prodDoc = await db.collection('products').doc(productId).get();
    if (!prodDoc.exists) {
      return res.status(404).json({ error: "Produto não encontrado." });
    }

    // Delete product document
    await db.collection('products').doc(productId).delete();

    // Delete related stocks
    const stocksSnap = await db.collection('stocks').where('productId', '==', productId).get();
    const batch = db.batch();
    stocksSnap.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    res.json({ success: true, message: "Produto e estoques associados deletados com sucesso." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/affiliates
app.get('/api/affiliates', async (req, res) => {
  try {
    const snapshot = await db.collection('affiliates').get();
    const list = [];
    snapshot.forEach(doc => {
      list.push(doc.data());
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /api/affiliates
app.post('/api/affiliates', async (req, res) => {
  const { name, location, commissionRate, status, email, password } = req.body;

  if (!name || !location || commissionRate === undefined || !email || !password) {
    return res.status(400).json({ error: "Campos obrigatórios faltando: nome, localidade, comissão, e-mail e senha." });
  }

  const emailLower = email.toLowerCase().trim();

  try {
    const snapshot = await db.collection('affiliates').where('email', '==', emailLower).get();
    if (!snapshot.empty || emailLower === 'admin@clipzfit.com') {
      return res.status(400).json({ error: "Este e-mail de acesso já está cadastrado no sistema." });
    }

    const newAffiliateId = `AFF-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAffiliate = {
      id: newAffiliateId,
      name,
      location,
      commissionRate: Number(commissionRate),
      totalSales: 0.00,
      commissionBalance: 0.00,
      status: status || "Active",
      email: emailLower,
      password: password
    };

    await db.collection('affiliates').doc(newAffiliateId).set(newAffiliate);

    // Initialize stocks for all existing products in catalog
    const productsSnap = await db.collection('products').get();
    const defaultProducts = ["prod-1", "prod-2", "prod-3"];
    for (const prodDoc of productsSnap.docs) {
      const prodId = prodDoc.id;
      const initialQty = defaultProducts.includes(prodId) ? 10 : 0;
      await db.collection('stocks').doc(`${newAffiliateId}_${prodId}`).set({
        affiliateId: newAffiliateId,
        productId: prodId,
        quantity: initialQty
      });
    }

    res.status(201).json(newAffiliate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/affiliates/:id
app.put('/api/affiliates/:id', async (req, res) => {
  const affiliateId = req.params.id;
  const { name, location, commissionRate, status, email, password } = req.body;

  if (!name || !location || commissionRate === undefined || !email || !password) {
    return res.status(400).json({ error: "Campos obrigatórios faltando: nome, localidade, comissão, e-mail e senha." });
  }

  const emailLower = email.toLowerCase().trim();

  try {
    const affDoc = await db.collection('affiliates').doc(affiliateId).get();
    if (!affDoc.exists) {
      return res.status(404).json({ error: "Parceiro não encontrado." });
    }

    const snapshot = await db.collection('affiliates').where('email', '==', emailLower).get();
    let isDuplicate = false;
    snapshot.forEach(doc => {
      if (doc.id !== affiliateId) {
        isDuplicate = true;
      }
    });

    if (isDuplicate || emailLower === 'admin@clipzfit.com') {
      return res.status(400).json({ error: "Este e-mail de acesso já está cadastrado em outro parceiro." });
    }

    const updatedData = {
      ...affDoc.data(),
      name,
      location,
      commissionRate: Number(commissionRate),
      status,
      email: emailLower,
      password
    };

    await db.collection('affiliates').doc(affiliateId).set(updatedData);
    res.json(updatedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/affiliates/:id (Excluir Parceiro e cascatear exclusões)
app.delete('/api/affiliates/:id', async (req, res) => {
  const affiliateId = req.params.id;

  try {
    const affRef = db.collection('affiliates').doc(affiliateId);
    const affDoc = await affRef.get();
    if (!affDoc.exists) {
      return res.status(404).json({ error: "Parceiro não encontrado." });
    }

    // Prepare deletion collections
    const stocksSnap = await db.collection('stocks').where('affiliateId', '==', affiliateId).get();
    const txsSnap = await db.collection('transactions').where('affiliateId', '==', affiliateId).get();
    const requestsSnap = await db.collection('replenishmentRequests').where('affiliateId', '==', affiliateId).get();
    const withdrawalsSnap = await db.collection('withdrawals').where('affiliateId', '==', affiliateId).get();

    const batch = db.batch();

    // Delete partner doc
    batch.delete(affRef);

    // Delete related stocks
    stocksSnap.forEach(doc => batch.delete(doc.ref));

    // Delete related transactions
    txsSnap.forEach(doc => batch.delete(doc.ref));

    // Delete related replenishment requests
    requestsSnap.forEach(doc => batch.delete(doc.ref));

    // Delete related withdrawals
    withdrawalsSnap.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    res.json({ 
      success: true, 
      message: `Parceiro, ${stocksSnap.size} estoques, ${txsSnap.size} vendas, ${requestsSnap.size} solicitações e ${withdrawalsSnap.size} saques foram excluídos com sucesso.` 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }

  const emailLower = email.toLowerCase().trim();

  if (emailLower === 'admin@clipzfit.com' && password === 'admin123') {
    return res.json({
      success: true,
      role: 'admin',
      email: 'admin@clipzfit.com',
      name: 'Administrador'
    });
  }

  try {
    const snapshot = await db.collection('affiliates')
      .where('email', '==', emailLower)
      .where('password', '==', password)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const affiliate = snapshot.docs[0].data();
      if (affiliate.status !== 'Active') {
        return res.status(403).json({ error: "Esta conta de parceiro está inativa." });
      }
      return res.json({
        success: true,
        role: 'lojista',
        affiliateId: affiliate.id,
        affiliateName: affiliate.name,
        email: affiliate.email
      });
    }

    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. POST /api/sales
app.post('/api/sales', async (req, res) => {
  const { affiliateId, items, paymentMethod, customerCpf, customerEmail } = req.body;

  if (!affiliateId || !items || !items.length || !paymentMethod || !customerCpf) {
    return res.status(400).json({ error: "Dados da venda incompletos: CPF, filial, itens e meio de pagamento são obrigatórios." });
  }

  try {
    const affRef = db.collection('affiliates').doc(affiliateId);
    const affDoc = await affRef.get();
    if (!affDoc.exists) {
      return res.status(404).json({ error: "Parceiro não encontrado." });
    }
    const affiliate = affDoc.data();

    // Verify stock availability
    for (const item of items) {
      const stockDoc = await db.collection('stocks').doc(`${affiliateId}_${item.productId}`).get();
      const availableStock = stockDoc.exists ? stockDoc.data().quantity : 0;
      if (availableStock < item.quantity) {
        return res.status(400).json({ error: `Estoque insuficiente para o produto: ${item.name}. Disponível: ${availableStock}.` });
      }
    }

    // Decrement stock
    for (const item of items) {
      const stockRef = db.collection('stocks').doc(`${affiliateId}_${item.productId}`);
      const currentStock = (await stockRef.get()).data().quantity;
      await stockRef.update({
        quantity: currentStock - item.quantity
      });
    }

    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const tax = 0;
    const total = subtotal;
    const commission = subtotal * (affiliate.commissionRate / 100);

    const txId = `TRX-${Math.floor(1000 + Math.random() * 9000)}`;
    const transaction = {
      id: txId,
      affiliateId,
      affiliateName: affiliate.name,
      amount: Number(subtotal.toFixed(2)),
      tax: 0.00,
      total: Number(total.toFixed(2)),
      commission: Number(commission.toFixed(2)),
      date: new Date().toISOString(),
      paymentMethod,
      customerCpf,
      customerEmail: customerEmail || null,
      items
    };

    // Save transaction
    await db.collection('transactions').doc(txId).set(transaction);

    // Update affiliate metrics
    await affRef.update({
      totalSales: admin.firestore.FieldValue.increment(transaction.amount),
      commissionBalance: admin.firestore.FieldValue.increment(transaction.commission)
    });

    const updatedAff = (await affRef.get()).data();

    res.status(201).json({ transaction, affiliate: updatedAff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sales/:id (Excluir Venda e reverter estoque/comissões)
app.delete('/api/sales/:id', async (req, res) => {
  const transactionId = req.params.id;

  try {
    const txRef = db.collection('transactions').doc(transactionId);
    const txDoc = await txRef.get();
    if (!txDoc.exists) {
      return res.status(404).json({ error: "Venda não encontrada." });
    }
    const transaction = txDoc.data();
    const { affiliateId, amount, commission, items } = transaction;

    // 1. Devolver estoque para o parceiro
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const stockRef = db.collection('stocks').doc(`${affiliateId}_${item.productId}`);
        const stockDoc = await stockRef.get();
        if (stockDoc.exists) {
          await stockRef.update({
            quantity: admin.firestore.FieldValue.increment(Number(item.quantity))
          });
        } else {
          await stockRef.set({
            affiliateId,
            productId: item.productId,
            quantity: Number(item.quantity)
          });
        }
      }
    }

    // 2. Reverter métricas do parceiro (faturamento e comissão)
    const affRef = db.collection('affiliates').doc(affiliateId);
    const affDoc = await affRef.get();
    if (affDoc.exists) {
      await affRef.update({
        totalSales: admin.firestore.FieldValue.increment(-Number(amount)),
        commissionBalance: admin.firestore.FieldValue.increment(-Number(commission))
      });
    }

    // 3. Excluir o documento da transação
    await txRef.delete();

    res.json({ success: true, message: "Venda excluída e estoque/métricas ajustados com sucesso." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. POST /api/affiliates/:id/withdraw
app.post('/api/affiliates/:id/withdraw', async (req, res) => {
  const affiliateId = req.params.id;

  try {
    const affRef = db.collection('affiliates').doc(affiliateId);
    const affDoc = await affRef.get();
    if (!affDoc.exists) {
      return res.status(404).json({ error: "Parceiro não encontrado." });
    }
    const affiliate = affDoc.data();

    const amountToWithdraw = affiliate.commissionBalance;
    if (amountToWithdraw <= 0) {
      return res.status(400).json({ error: "Saldo de comissão insuficiente para realizar o saque." });
    }

    const withdrawalId = `WD-${Math.floor(1000 + Math.random() * 9000)}`;
    const withdrawal = {
      id: withdrawalId,
      affiliateId,
      affiliateName: affiliate.name,
      amount: amountToWithdraw,
      date: new Date().toISOString()
    };

    await affRef.update({
      commissionBalance: 0.00
    });

    await db.collection('withdrawals').doc(withdrawalId).set(withdrawal);

    // Generate withdrawal notification
    const notifId = `NT-${Math.floor(1000 + Math.random() * 9000)}`;
    await db.collection('notifications').doc(notifId).set({
      id: notifId,
      title: "Saque de Comissão",
      message: `Filial ${affiliate.name} solicitou saque de comissão no valor de R$ ${amountToWithdraw.toFixed(2)}.`,
      date: new Date().toISOString(),
      read: false
    });

    const updatedAff = (await affRef.get()).data();

    res.status(200).json({ success: true, withdrawal, affiliate: updatedAff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. GET /api/seller/metrics
app.get('/api/seller/metrics', async (req, res) => {
  const affiliateId = req.query.affiliateId || "AFF-1001";

  try {
    const affDoc = await db.collection('affiliates').doc(affiliateId).get();
    if (!affDoc.exists) {
      return res.status(404).json({ error: "Parceiro não encontrado." });
    }
    const affiliate = affDoc.data();

    // Fetch transactions and sort in memory (avoids index requirements)
    const snapshot = await db.collection('transactions')
      .where('affiliateId', '==', affiliateId)
      .get();

    const transactions = [];
    snapshot.forEach(doc => {
      transactions.push(doc.data());
    });

    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentTransactions = transactions.slice(0, 10);

    res.json({
      affiliateId: affiliate.id,
      name: affiliate.name,
      commissionRate: affiliate.commissionRate,
      totalSales: affiliate.totalSales,
      commissionBalance: affiliate.commissionBalance,
      transactions: recentTransactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. GET /api/stocks
app.get('/api/stocks', async (req, res) => {
  try {
    const snapshot = await db.collection('stocks').get();
    const stocksList = [];
    
    for (const doc of snapshot.docs) {
      const stock = doc.data();
      const affiliateDoc = await db.collection('affiliates').doc(stock.affiliateId).get();
      const productDoc = await db.collection('products').doc(stock.productId).get();
      
      if (affiliateDoc.exists && productDoc.exists) {
        stocksList.push({
          affiliateId: stock.affiliateId,
          affiliateName: affiliateDoc.data().name,
          productId: stock.productId,
          productName: productDoc.data().name,
          category: productDoc.data().category || "Suplementos",
          quantity: stock.quantity
        });
      }
    }
    res.json(stocksList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. GET /api/stocks/requests
app.get('/api/stocks/requests', async (req, res) => {
  const affiliateId = req.query.affiliateId;

  try {
    let query = db.collection('replenishmentRequests');
    if (affiliateId) {
      query = query.where('affiliateId', '==', affiliateId);
    }
    const snapshot = await query.get();
    const list = [];
    snapshot.forEach(doc => {
      list.push(doc.data());
    });

    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. GET /api/stocks/:affiliateId
app.get('/api/stocks/:affiliateId', async (req, res) => {
  const affId = req.params.affiliateId;

  try {
    const affDoc = await db.collection('affiliates').doc(affId).get();
    if (!affDoc.exists) {
      return res.status(404).json({ error: "Estoque não encontrado para esta filial." });
    }

    const snapshot = await db.collection('stocks')
      .where('affiliateId', '==', affId)
      .get();

    const affStocks = [];
    for (const doc of snapshot.docs) {
      const stock = doc.data();
      const productDoc = await db.collection('products').doc(stock.productId).get();
      if (productDoc.exists) {
        const product = productDoc.data();
        affStocks.push({
          productId: stock.productId,
          productName: product.name,
          price: product.price,
          promoPrice: product.promoPrice || null,
          category: product.category || "Suplementos",
          image: product.image,
          type: product.type,
          quantity: stock.quantity
        });
      }
    }
    res.json(affStocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. POST /api/stocks/replenish
app.post('/api/stocks/replenish', async (req, res) => {
  const { affiliateId, productId, quantity } = req.body;

  if (!affiliateId || !productId || quantity === undefined) {
    return res.status(400).json({ error: "Faltando parâmetros: affiliateId, productId, quantity." });
  }

  try {
    // Validate CD (generalStock) and deduct
    const prodRef = db.collection('products').doc(productId);
    const prodDoc = await prodRef.get();
    if (!prodDoc.exists) {
      return res.status(404).json({ error: "Produto não encontrado no CD." });
    }
    const product = prodDoc.data();
    const qtyToMove = Number(quantity);

    if (product.generalStock !== undefined) {
      if (product.generalStock < qtyToMove) {
        return res.status(400).json({ error: `Estoque geral no CD insuficiente. Disponível: ${product.generalStock} un.` });
      }
      // Deduct from CD stock
      await prodRef.update({
        generalStock: admin.firestore.FieldValue.increment(-qtyToMove)
      });
    }

    const stockRef = db.collection('stocks').doc(`${affiliateId}_${productId}`);
    const doc = await stockRef.get();
    let newQty = qtyToMove;

    if (doc.exists) {
      newQty += doc.data().quantity;
      await stockRef.update({
        quantity: newQty
      });
    } else {
      await stockRef.set({
        affiliateId,
        productId,
        quantity: newQty
      });
    }

    res.json({ success: true, newQuantity: newQty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. POST /api/stocks/request
app.post('/api/stocks/request', async (req, res) => {
  const { affiliateId, productId, quantity } = req.body;

  if (!affiliateId || !productId || !quantity) {
    return res.status(400).json({ error: "Faltando parâmetros: affiliateId, productId, quantity." });
  }

  try {
    const affiliateDoc = await db.collection('affiliates').doc(affiliateId).get();
    const productDoc = await db.collection('products').doc(productId).get();

    if (!affiliateDoc.exists || !productDoc.exists) {
      return res.status(404).json({ error: "Filial ou produto não encontrado." });
    }

    const affiliate = affiliateDoc.data();
    const product = productDoc.data();

    const requestId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRequest = {
      id: requestId,
      affiliateId,
      affiliateName: affiliate.name,
      productId,
      productName: product.name,
      quantity: Number(quantity),
      status: "Pendente",
      date: new Date().toISOString()
    };

    await db.collection('replenishmentRequests').doc(requestId).set(newRequest);

    // Save notification
    const notifId = `NT-${Math.floor(1000 + Math.random() * 9000)}`;
    await db.collection('notifications').doc(notifId).set({
      id: notifId,
      title: "Reposição Solicitada",
      message: `Filial ${affiliate.name} solicitou reposição de ${quantity} un de ${product.name}.`,
      date: new Date().toISOString(),
      read: false
    });

    res.status(201).json(newRequest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. POST /api/stocks/requests/:id/approve
app.post('/api/stocks/requests/:id/approve', async (req, res) => {
  const requestId = req.params.id;

  try {
    const reqRef = db.collection('replenishmentRequests').doc(requestId);
    const requestDoc = await reqRef.get();
    if (!requestDoc.exists) {
      return res.status(404).json({ error: "Solicitação não encontrada." });
    }
    const request = requestDoc.data();

    if (request.status !== "Pendente") {
      return res.status(400).json({ error: "Esta solicitação já foi processada." });
    }

    // Validate CD (generalStock) and deduct
    const prodRef = db.collection('products').doc(request.productId);
    const prodDoc = await prodRef.get();
    if (!prodDoc.exists) {
      return res.status(404).json({ error: "Produto solicitado não encontrado no CD." });
    }
    const product = prodDoc.data();
    const qtyToMove = Number(request.quantity);

    if (product.generalStock !== undefined) {
      if (product.generalStock < qtyToMove) {
        return res.status(400).json({ error: `Estoque geral no CD insuficiente para atender a esta solicitação. Disponível: ${product.generalStock} un.` });
      }
      // Deduct from CD stock
      await prodRef.update({
        generalStock: admin.firestore.FieldValue.increment(-qtyToMove)
      });
    }

    const stockRef = db.collection('stocks').doc(`${request.affiliateId}_${request.productId}`);
    const stockDoc = await stockRef.get();
    let currentQty = 0;
    if (stockDoc.exists) {
      currentQty = stockDoc.data().quantity;
    }

    const newQty = currentQty + qtyToMove;
    await stockRef.set({
      affiliateId: request.affiliateId,
      productId: request.productId,
      quantity: newQty
    });

    await reqRef.update({
      status: "Aprovado"
    });

    res.json({ success: true, request: { ...request, status: "Aprovado" }, newStock: newQty });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. GET /api/notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const snapshot = await db.collection('notifications').get();
    const list = [];
    snapshot.forEach(doc => {
      list.push(doc.data());
    });

    list.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. POST /api/notifications/read-all
app.post('/api/notifications/read-all', async (req, res) => {
  try {
    const snapshot = await db.collection('notifications').where('read', '==', false).get();
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 15. POST /api/notifications/clear
app.post('/api/notifications/clear', async (req, res) => {
  try {
    const snapshot = await db.collection('notifications').get();
    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mercado Pago Checkout Pro Draft Endpoints

// 16. POST /api/checkout/preference
app.post('/api/checkout/preference', async (req, res) => {
  const { affiliateId, items, customerCpf, customerEmail } = req.body;
  
  if (!affiliateId || !items || !items.length || !customerCpf) {
    return res.status(400).json({ error: "Dados incompletos para geração do checkout." });
  }

  try {
    // Validar existência da filial
    const affDoc = await db.collection('affiliates').doc(affiliateId).get();
    if (!affDoc.exists) {
      return res.status(404).json({ error: "Parceiro não encontrado." });
    }
    const affiliate = affDoc.data();

    // Validar estoque disponível localmente antes de gerar a preferência
    for (const item of items) {
      const stockDoc = await db.collection('stocks').doc(`${affiliateId}_${item.productId}`).get();
      const availableStock = stockDoc.exists ? stockDoc.data().quantity : 0;
      if (availableStock < item.quantity) {
        return res.status(400).json({ error: `Estoque insuficiente para: ${item.name}. Disponível: ${availableStock}.` });
      }
    }

    // Criar registro de venda pendente no Firestore
    const pendingSaleId = `PND-${Math.floor(100000 + Math.random() * 900000)}`;

    let subtotal = 0;
    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const pendingSale = {
      id: pendingSaleId,
      affiliateId,
      affiliateName: affiliate.name,
      amount: Number(subtotal.toFixed(2)),
      commissionRate: affiliate.commissionRate,
      customerCpf,
      customerEmail: customerEmail || null,
      items,
      status: "Pending",
      createdAt: new Date().toISOString()
    };
    await db.collection('pending_sales').doc(pendingSaleId).set(pendingSale);

    // Configurar chamada para API do Mercado Pago usando o SDK oficial (v2)
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
    let initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_${pendingSaleId}`;

    if (token && token.trim() !== "") {
      try {
        const { MercadoPagoConfig, Preference } = require('mercadopago');
        
        // Inicializar o cliente com o Access Token
        const client = new MercadoPagoConfig({ accessToken: token });
        
        // Criar a preferência
        const preference = new Preference(client);

        const mpItems = items.map(item => ({
          title: item.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.price),
          currency_id: "BRL"
        }));

        const response = await preference.create({
          body: {
            items: mpItems,
            external_reference: pendingSaleId,
            back_urls: {
              success: `${req.protocol}://${req.get('host')}/checkout/success`,
              failure: `${req.protocol}://${req.get('host')}/checkout/failure`,
              pending: `${req.protocol}://${req.get('host')}/checkout/pending`
            },
            auto_return: "approved"
          }
        });

        if (response && response.init_point) {
          initPoint = response.init_point;
          console.log(`[Mercado Pago SDK] Preferência criada com sucesso: ${response.id}`);
        } else {
          console.error("[Mercado Pago SDK] Resposta inesperada do SDK:", response);
        }
      } catch (mpErr) {
        console.error("[Mercado Pago SDK] Falha ao criar preferência via SDK:", mpErr.message || mpErr);
      }
    } else {
      console.log(`[MOCK MP] Token não configurado em MERCADOPAGO_ACCESS_TOKEN. Usando checkout mock para venda pendente: ${pendingSaleId}`);
    }

    res.status(200).json({ 
      success: true, 
      pendingSaleId,
      init_point: initPoint 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 17. POST /api/webhooks/mercadopago
app.post('/api/webhooks/mercadopago', async (req, res) => {
  const paymentId = req.body?.data?.id || req.query?.id;
  const type = req.body?.type || req.query?.topic;

  // Parâmetros para testes de integração local simulando a aprovação
  const isMockTest = req.body?.isMockTest === true;
  const mockPendingSaleId = req.body?.pendingSaleId;

  console.log(`[Webhook MP] Notificação recebida: tipo=${type}, pagamentoId=${paymentId}`);

  if (!paymentId && !isMockTest) {
    return res.status(400).json({ error: "ID de pagamento não fornecido." });
  }

  try {
    let pendingSaleId = null;
    let paymentStatus = null;

    if (isMockTest) {
      pendingSaleId = mockPendingSaleId;
      paymentStatus = req.body?.status || "approved";
      console.log(`[Webhook MP] Processando como teste simulado local. Status=${paymentStatus}`);
    } else if (type === 'payment' || req.query?.topic === 'payment') {
      const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
      
      if (mpAccessToken && mpAccessToken.trim() !== "") {
        const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${mpAccessToken}`
          }
        });

        if (response.ok) {
          const paymentData = await response.json();
          paymentStatus = paymentData.status;
          pendingSaleId = paymentData.external_reference;
        } else {
          console.error(`[Webhook MP] Erro ao consultar pagamento ${paymentId}:`, await response.text());
          return res.status(502).json({ error: "Falha ao consultar detalhes do pagamento no Mercado Pago." });
        }
      } else {
        console.log("[Webhook MP] Sem token do Mercado Pago. Usando simulação fallback com ID:", paymentId);
        return res.status(200).json({ message: "Mock webhook recebido (ignorado por falta de token)." });
      }
    } else {
      return res.status(200).json({ message: "Tópico de evento ignorado." });
    }

    if (!pendingSaleId) {
      return res.status(400).json({ error: "Referência externa (pendingSaleId) não encontrada no pagamento." });
    }

    const pendingRef = db.collection('pending_sales').doc(pendingSaleId);
    const pendingDoc = await pendingRef.get();
    if (!pendingDoc.exists) {
      return res.status(404).json({ error: `Venda pendente ${pendingSaleId} não encontrada.` });
    }

    const pendingSale = pendingDoc.data();

    if (pendingSale.status !== 'Pending') {
      return res.status(200).json({ message: `Venda já foi processada anteriormente. Status atual: ${pendingSale.status}` });
    }

    if (paymentStatus === 'approved') {
      // 1. Validar estoque local novamente (evitar inconsistências por race-conditions)
      for (const item of pendingSale.items) {
        const stockRef = db.collection('stocks').doc(`${pendingSale.affiliateId}_${item.productId}`);
        const stockDoc = await stockRef.get();
        const qtyAvailable = stockDoc.exists ? stockDoc.data().quantity : 0;
        if (qtyAvailable < item.quantity) {
          await pendingRef.update({ status: "Failed", error: `Estoque insuficiente para o produto: ${item.name}` });
          return res.status(400).json({ error: "Estoque insuficiente durante a confirmação." });
        }
      }

      // 2. Decrementar estoque
      for (const item of pendingSale.items) {
        const stockRef = db.collection('stocks').doc(`${pendingSale.affiliateId}_${item.productId}`);
        await stockRef.update({
          quantity: admin.firestore.FieldValue.increment(-Number(item.quantity))
        });
      }

      // 3. Salvar transação oficial
      const commissionAmount = pendingSale.amount * (pendingSale.commissionRate / 100);
      const txId = `TRX-${Math.floor(100000 + Math.random() * 900000)}`;
      const transaction = {
        id: txId,
        affiliateId: pendingSale.affiliateId,
        affiliateName: pendingSale.affiliateName,
        amount: pendingSale.amount,
        tax: 0.00,
        total: pendingSale.amount,
        commission: Number(commissionAmount.toFixed(2)),
        date: new Date().toISOString(),
        paymentMethod: "Mercado Pago",
        customerCpf: pendingSale.customerCpf,
        customerEmail: pendingSale.customerEmail,
        items: pendingSale.items,
        mpPaymentId: paymentId || "MOCK-PAYMENT"
      };
      await db.collection('transactions').doc(txId).set(transaction);

      // 4. Atualizar métricas acumuladas do lojista
      const affRef = db.collection('affiliates').doc(pendingSale.affiliateId);
      await affRef.update({
        totalSales: admin.firestore.FieldValue.increment(transaction.amount),
        commissionBalance: admin.firestore.FieldValue.increment(transaction.commission)
      });

      // 5. Atualizar venda pendente para Aprovada
      await pendingRef.update({
        status: "Approved",
        transactionId: txId,
        updatedAt: new Date().toISOString()
      });

      console.log(`[Webhook MP] Venda ${pendingSaleId} aprovada e faturada como ${txId}!`);
      return res.status(200).json({ success: true, message: "Pagamento aprovado e processado com sucesso.", transactionId: txId });
    } else {
      await pendingRef.update({
        status: paymentStatus === 'rejected' ? 'Rejected' : 'Cancelled',
        updatedAt: new Date().toISOString()
      });
      console.log(`[Webhook MP] Venda ${pendingSaleId} foi atualizada para status: ${paymentStatus}`);
      return res.status(200).json({ success: true, message: `Status da venda atualizado para ${paymentStatus}.` });
    }

  } catch (err) {
    console.error("[Webhook MP] Erro no processamento:", err);
    res.status(500).json({ error: err.message });
  }
});

// Conditionally listen locally
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
