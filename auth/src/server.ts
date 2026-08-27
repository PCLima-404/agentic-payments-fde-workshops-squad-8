// TODO (Pessoa 1): inicializador do servidor de auth
import app from "./app";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`auth service rodando na porta ${PORT}`);
});
