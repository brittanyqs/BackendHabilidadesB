const mongoose = require("mongoose");

const EncuestaSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  respuestas: [
    {
      pregunta: String,
      respuesta: String,
    },
  ],
  puntaje: { type: Number, required: true },
  nivel: { type: String, enum: ["BAJO", "MEDIO", "ALTO"], required: true },
  fecha: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Encuesta", EncuestaSchema);
