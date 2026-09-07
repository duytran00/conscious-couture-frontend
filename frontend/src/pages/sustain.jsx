import "./sustain.css";

const ImpactCard = ({ title, image, text, source }) => {
  return (
    <div className="impact-card">
      <div className="impact-card-image">
        <img src={image} alt={title} />
      </div>
      <div className="impact-card-content">
        <h3>{title}</h3>
        <p>{text}</p>
        <span className="impact-card-source">Source: {source}</span>
      </div>
    </div>
  );
};

const InfoSection = ({ title, children }) => {
  return (
    <div className="info-section">
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
};

const Sustain = () => {
  const impactData = [
    {
      title: "Water Consumption",
      image: "https://images.teemill.com/ae4ncioyrioci3q2ghzziimvdh0z5mol75gmqlcvku95uxgy.png.jpg?w=680&h=auto",
      text: "According to the UN Environmental Programme, the fashion industry is the second largest consumer of water. It takes roughly 700 gallons of water to produce one cotton t-shirt and roughly 2,000 gallons of water to produce one pair of jeans. 200 tons of water is used per ton of dyed fabric.",
      source: "teemill.com"
    },
    {
      title: "Chemical Pollution",
      image: "https://images.squarespace-cdn.com/content/v1/5981c7129f7456741cde6662/1513876498325-WLRF5A6ZB212N09DI6ZB/Rivers+Pollution+by+Textile+Industry?format=750w",
      text: "The water leftover from the textile dyeing process is often dumped into ditches, streams or rivers. The wastewater contains toxic substances such as lead, mercury, arsenic, and others. This makes it harmful for aquatic life and the people living around the river banks.",
      source: "sustainyourstyle.org"
    },
    {
      title: "Microplastics",
      image: "https://cdn4.dogonews.com/images/11a259a5-5642-491e-9186-a6a952ddfd5b/137690519_426527588472235_2180863395742241988_n.jpeg",
      text: "Plenty of clothing brands use synthetic fibers such as polyester, nylon and acrylic that can take up to hundreds of years to biodegrade. Every year washing clothes releases approximately 500,000 tons of microplastics into the ocean which is equivalent to 50 billion plastic bottles.",
      source: "waterguardianexperts.thewaternetwork.com"
    },
    {
      title: "Waste",
      image: "https://earth.org/wp-content/uploads/2022/08/Untitled-1024-%C3%97-683px-95.jpg.webp",
      text: "100 billion garments get produced each year and 92 million tons of textile waste go to the dumps each year. That is equivalent to a garbage truck full of clothes in the landfill every second.",
      source: "earth.org"
    }
  ];

  return (
    <div className="sustain-container">
      {/* Hero Section */}
      <section className="sustain-hero">
        <div className="sustain-hero-content">
          <h1>Environmental Impact of Fashion</h1>
          <p>Understanding the true cost of fast fashion and why sustainable choices matter</p>
        </div>
      </section>

      {/* Impact Cards Grid */}
      <section className="impact-section">
        <div className="section-header">
          <h2>The Hidden Cost of Fast Fashion</h2>
          <p>The fashion industry is one of the world's largest polluters. Here's what you need to know.</p>
        </div>
        <div className="impact-grid">
          {impactData.map((item, index) => (
            <ImpactCard
              key={index}
              title={item.title}
              image={item.image}
              text={item.text}
              source={item.source}
            />
          ))}
        </div>
      </section>

      {/* Additional Info Sections */}
      <section className="info-sections">
        <div className="section-header">
          <h2>Making a Difference</h2>
          <p>Learn how resale and sustainable fashion can help reduce environmental impact.</p>
        </div>

        <div className="info-grid">
          <InfoSection title="Greenhouse Gas Emissions">
            The apparel industry's greenhouse gas emissions reached 944 million metric tons in 2023 according to the Apparel Impact Institute, accounting for nearly 2% of total global emissions that year. Production accounts for approximately 70% of fashion's emissions, but it's the hardest to reinvent. Key drivers include increased production volumes and a greater reliance on virgin polyester.
          </InfoSection>

          <InfoSection title="Why Should You Resale?">
            Unlike transforming supply chains, keeping existing items in circulation is a scalable, proven, easy-to-implement solution to the fashion waste crisis. Resale extends the life of items that have already been produced and had their environmental impact. It's one of the most accessible ways to reduce fashion's significant and increasing carbon footprint.
          </InfoSection>

          <InfoSection title="Future of Sustainable Fashion">
            Authenticity and transparency are key to efforts towards making the future of fashion more sustainable. The fashion industry has a long way to go in reducing its impact on the planet. We strive to communicate the environmental value of resale, inspire more people to participate in the circular economy, and motivate peers to support circular solutions.
          </InfoSection>

          <InfoSection title="Measuring Environmental Savings">
            We calculate environmental savings for each item based on fabric, material, and product type. Item savings are added together to arrive at totals of cumulative estimated environmental savings. This includes metric tons of carbon dioxide (equivalent to the amount of CO2 absorbed by trees in one year) and liters of water saved through resale.
          </InfoSection>
        </div>
      </section>

      {/* Call to Action */}
      <section className="sustain-cta">
        <div className="cta-content">
          <h2>Join the Movement</h2>
          <p>Every item you buy secondhand makes a difference. Shop sustainably with Conscious Couture.</p>
        </div>
      </section>
    </div>
  );
};

export default Sustain;
