// ================================
// 📦 Importaciones
// ================================
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const app = express();

// ================================
// ⚙️ Configuración general
// ================================
const PORT = process.env.PORT || 7000;
const MONGO_URI = 'mongodb+srv://brittanyqsctpa_db_user:JecMfOAxLdj8Mhvp@cluster0.bi2ydop.mongodb.net/?appName=Cluster0';

// Middleware CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501',
      'https://frontendhabilidadesb.netlify.app'
    ];

    if (!origin || allowedOrigins.includes(origin) || /\.netlify\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS bloqueado: origen no permitido.'));
    }
  },
  credentials: true
}));

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuración de sesión (muy importante para que funcione el login)
app.use(session({
  secret: 'secreto123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,        // ⚠️ Cámbialo a true si usas HTTPS (Netlify)
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// Si lo despliegas en Render / Netlify / etc.
app.set('trust proxy', 1);

// ================================
// 🧩 Conexión a MongoDB Atlas
// ================================
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// ================================
// 🧠 Rutas API
// ================================

// 📄 Verificar sesión de usuario
app.get('/api/user', (req, res) => {
  console.log('📢 Sesión actual:', req.session);
  if (req.session?.userId) {
    res.json({ loggedIn: true, name: req.session.userName });
  } else {
    res.json({ loggedIn: false });
  }
});

// 📝 Registro de usuario
app.post('/registro', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe.' });
    }

    // 🔒 Encriptar contraseña antes de guardar
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Registro exitoso.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el registro.' });
  }
});

// 🔐 Login de usuario
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Usuario no encontrado' });
  }

  // 🔍 Comparar contraseñas encriptadas
  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.status(400).json({ success: false, message: 'Contraseña incorrecta' });
  }

  // Guardar sesión del usuario
  req.session.userId = user._id;
  req.session.userName = user.name;

  console.log('✅ Sesión iniciada:', req.session);

  res.json({
    success: true,
    message: 'Login exitoso',
    name: user.name,
    email: user.email
  });
});

// 🚪 Cerrar sesión
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('❌ Error al cerrar sesión:', err);
      return res.status(500).json({ message: 'Error al cerrar sesión.' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Sesión cerrada correctamente.' });
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.send('✅ Servidor backend activo');
});

// ================================
// 🚀 Servidor activo
// ================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
