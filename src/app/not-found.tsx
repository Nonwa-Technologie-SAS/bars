// Next.js app entry point (app router)
export default function NotFound() {
  return (
    <main style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 – Page introuvable</h1>
      <p>La page que vous recherchez n’existe pas.</p>
      <a href="/" style={{ color: '#0070f3', textDecoration: 'underline' }}>
        Retour à l’accueil
      </a>
    </main>
  );
}
