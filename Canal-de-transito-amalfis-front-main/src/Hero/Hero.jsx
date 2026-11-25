import './Hero.css';

const Hero = () => {
  return (
    <section className="hero" id="canal" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <div className="hero__head reveal">
          <div>
            <div className="hero__eyebrow-rule" aria-hidden="true" />
            <h1 className="hero__title" id="hero-title">
              Canal de <span className="is-accent">Trânsito</span>
            </h1>
            <p className="hero__subtitle">
              Ajude a tornar nossas vias mais seguras!
            </p>
          </div>

          <p className="hero__ethos" aria-label="Nossos princípios">
            <b>Ética</b>
            <span className="dot" aria-hidden="true" />
            <b>Respeito</b>
            <span className="dot" aria-hidden="true" />
            <b>Transparência</b>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
