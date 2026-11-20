const express = require('express');
const controller = require('../controllers/cursos.controller');
const {
  verificarToken,
  requiereRol,
} = require('../middlewares/auth');

const router = express.Router();

router.use(verificarToken);

router.get('/', controller.findAll);
router.get('/:id', controller.findById);

router.post(
  '/',
  requiereRol('administrador'),
  controller.create
);

router.put(
  '/:id',
  requiereRol('administrador'),
  controller.update
);

router.delete(
  '/:id',
  requiereRol('administrador'),
  controller.remove
);

module.exports = router;