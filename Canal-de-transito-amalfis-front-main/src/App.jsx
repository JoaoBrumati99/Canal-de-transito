import './App.css';
import Header from './Header/Header';
import Hero from './Hero/Hero';
import InfoSection from './InfoSection/InfoSection';
import DenunciaForm from './DenunciaForm/DenunciaForm';
import Footer from './Footer/Footer';

function App() {
  return (
    <div className="page">
      <Header />

      <main className="page__body">
        <Hero />

        <section className="container layout" id="inicio" aria-label="Registrar ocorrência de trânsito">
          <InfoSection />
          <DenunciaForm />
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default App;
