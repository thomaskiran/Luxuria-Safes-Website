const fs = require('fs');
const path = require('path');

const template = (data) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Luxuria Safes - ${data.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/main.css">
</head>
<body>
    <header id="masthead" class="site-header scrolled">
        <div class="header-inner container">
            <div class="site-branding">
                <h1 class="site-title">
                    <a href="index.html" style="display: flex; align-items: center;">
                        <img src="..\\\\Luxuria-Safes-logo.svg" alt="Luxuria Safes Logo" style="height: 2rem; width: auto;">
                    </a>
                </h1>
            </div>
            <div class="menu-toggle" aria-label="Toggle navigation">
                <span></span><span></span><span></span>
            </div>
            <nav class="main-navigation">
                <ul>
                    <li><a href="index.html">Home</a></li>
                    <li><a href="collections.html">The Collections</a></li>
                    <li><a href="story.html">Our Story</a></li>
                    <li><a href="contact.html">Contact</a></li>
                </ul>
            </nav>
        </div>
    </header>

    <main class="page-header pt-xl bg-black">
        <!-- 1. HERO SECTION -->
        <section class="product-hero flex-split align-stretch">
            <div class="product-gallery flex-1 flex-center bg-darker">
                <div class="main-image-display mb-md">
                    <div class="placeholder-img tall-img" style="background: url('../Products/Vault rooms/Collectors room/Product Photos/treasure-room.jpg') center/cover; width:100%; height:100%; min-height:600px;"></div>
                </div>
            </div>

            <div class="product-info flex-1 flex-center section-padding pt-xl">
                <div class="info-inner reveal-up">
                    <span class="eyebrow gold-text">Security Vault Doors</span>
                    <h1 class="product-title accent-title" style="font-size: 4rem;">${data.name}</h1>
                    <p class="eyebrow mt-sm" style="color:var(--color-silver); font-size:1.2rem; text-transform:none; letter-spacing:normal;">${data.subheading}</p>

                    <!-- 2. OVERVIEW SECTION -->
                    <div class="product-description mt-md text-block">
                        <p>${data.overview}</p>
                    </div>

                    <div class="action-buttons mt-xl">
                        <a href="contact.html" class="btn btn-primary btn-gold">Request Quote</a>
                        <a href="#" class="btn btn-outline hover-fill ml-sm">Download Brochure</a>
                    </div>
                </div>
            </div>
        </section>

        <!-- 3. PRODUCT BENEFITS SECTION -->
        <section id="benefits" class="section-padding bg-dark">
            <div class="container">
                <h2 class="accent-title text-center mb-xl" style="font-size: 3rem;">Product Benefits</h2>
                <div class="grid grid-${Math.min(data.benefits.length, 4)}">
                    ${data.benefits.map((b, i) => `
                    <div class="collection-card reveal-up" style="transition-delay: ${0.2 * i}s;">
                        <div class="card-content" style="height: 100%;">
                            <h3 class="gold-text" style="display: flex; align-items: center; justify-content: center; gap: 1rem; margin-bottom: 1rem;">
                                ${b.title}
                            </h3>
                            <p style="text-align: center; color: var(--color-silver);">${b.desc}</p>
                        </div>
                    </div>`).join('')}
                </div>
            </div>
        </section>

        <!-- 4. TECHNICAL SPECIFICATIONS & 5. KEY FEATURES -->
        <section id="specifications" class="section-padding bg-black border-top-gold">
            <div class="container">
                <div class="flex-split align-stretch flex-wrap" style="gap: 4rem;">
                    <div class="flex-1" style="min-width: 300px;">
                        <h2 class="accent-title mb-lg" style="font-size: 3rem;">Technical Specifications</h2>
                        <div class="table-wrapper">
                            <table class="table-luxury" style="width: 100%;">
                                <tbody>
                                    ${Object.entries(data.specs).map(([k, v]) => `
                                    <tr>
                                        <th style="width: 50%; text-align: left; padding: 1rem;">${k}</th>
                                        <td style="width: 50%; text-align: right; padding: 1rem;">${v}</td>
                                    </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="flex-1" style="min-width: 300px;">
                        <h2 class="accent-title mb-lg" style="font-size: 3rem;">Key Features</h2>
                        <ul class="option-list" style="text-align: left; padding-top: 1rem;">
                            ${data.features.map(f => `
                            <li style="margin-bottom: 1rem;">
                                <strong class="gold-text">${f.title}:</strong> ${f.desc}
                            </li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- 6. RECOMMENDED APPLICATIONS -->
        <section id="applications" class="section-padding bg-darker border-top-gold">
            <div class="container text-center">
                <h2 class="accent-title mb-lg" style="font-size: 3rem;">Recommended Applications</h2>
                <div class="grid" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; max-width: 900px; margin: 0 auto;">
                    ${data.applications.map(a => `
                    <div style="background: var(--color-black); border: 1px solid rgba(255,255,255,0.1); padding: 1rem 2rem; border-radius: 4px; color: var(--color-silver);">
                        ${a}
                    </div>`).join('')}
                </div>
            </div>
        </section>

        <!-- 7. OPTIONAL SECTIONS (Inquiry CTA) -->
        <section class="section-padding bg-black" style="padding-bottom: 6rem;">
            <div class="config-card flex-center mb-0" style="border: 1px solid var(--color-gold); background: rgba(212, 175, 55, 0.05); max-width: 800px; margin: 0 auto; padding: 4rem 2rem;">
                <h3 style="margin-bottom: 1rem;">Secure Your Environment</h3>
                <p class="text-center" style="margin-bottom: 2rem;">Contact our security experts to discuss custom configurations, structural integration, and specific installation requirements.</p>
                <a href="contact.html" class="btn btn-primary btn-gold">Contact Sales Advisor</a>
            </div>
        </section>
    </main>

    <footer id="colophon" class="site-footer">
        <div class="site-info container text-center">
            <p>&copy; 2026 Luxuria Safes. All Rights Reserved.</p>
        </div>
    </footer>
    <script src="assets/js/main.js"></script>
</body>
</html>`;

const products = [
    {
        filename: 'single-vault-door-template.html',
        name: '[Product Name]',
        subheading: '[Sub-heading / Tagline]',
        overview: '[Overview paragraph description. Easily replaceable via ACF or Gutenberg text block.]',
        benefits: [
            { title: '[Benefit 1]', desc: '[Benefit description text]' },
            { title: '[Benefit 2]', desc: '[Benefit description text]' },
            { title: '[Benefit 3]', desc: '[Benefit description text]' }
        ],
        specs: {
            '[Parameter 1]': '[Value 1]',
            '[Parameter 2]': '[Value 2]',
            '[Parameter 3]': '[Value 3]'
        },
        features: [
            { title: '[Feature 1]', desc: '[Feature description]' },
            { title: '[Feature 2]', desc: '[Feature description]' }
        ],
        applications: ['[Application 1]', '[Application 2]', '[Application 3]']
    },
    {
        filename: 'single-vault-door-Chubb-2-Strongroom.html',
        name: 'Chubb 2” Strongroom Door',
        subheading: 'Entry-Level High-Security & Fire Resistant Vault Door',
        overview: 'The Chubbsafes 2” Strongroom Door is a reliable, entry-level high-security vault door designed for commercial and institutional applications. It combines robust construction with proven locking systems to safeguard cash, documents, and valuables.',
        benefits: [
            { title: 'Certified Protection', desc: 'Designed for applications requiring certified burglary and fire protection.' },
            { title: 'Proven Materials', desc: 'Filled with Chubbsafes F80 barrier material reinforced with steel fibers.' },
            { title: 'Fire Resistance', desc: 'Offers high-level thermal protection for up to 120 minutes.' },
            { title: 'Reliable Locking', desc: 'Dual locking system provides a redundant layer of security.' }
        ],
        specs: {
            'Protective Barrier Thickness': '50 mm (2”)',
            'Total Door Thickness': 'Approx. 165 mm',
            'Boltwork System': '18-bolt multi-directional (7 front, 2 top, 2 bottom, 7 rear passive)',
            'Bolt Diameter': 'Approx. 32 mm',
            'Standard Locking': '3-wheel combination lock + 8-lever double-bitted key lock',
            'Fire Resistance': '120 Minutes'
        },
        features: [
            { title: 'Anti-Tamper Protection', desc: 'Equipped with a glass relocker and drill-resistant protection plates.' },
            { title: 'Robust Boltwork', desc: 'Features a comprehensive multi-directional bolt system for maximum door-to-frame integrity.' },
            { title: 'Reinforced Barrier', desc: 'Utilizes specialized F80 barrier material for physical attack resistance.' }
        ],
        applications: ['Cash rooms', 'Document storage', 'Retail back offices', 'Entry-level vault rooms']
    },
    {
        filename: 'single-vault-door-Chubb-3-5-Strongroom.html',
        name: 'Chubb 3.5” Strongroom Door',
        subheading: 'Enhanced High-Security Solution for Modern Attack Resistance',
        overview: 'The 3.5” Strongroom Door is a higher-security solution engineered for environments requiring increased resistance against modern attack methods. It offers enhanced barrier thickness, stronger boltwork, and upgraded locking protection.',
        benefits: [
            { title: 'Enhanced Barrier', desc: 'Increased protective barrier thickness of 89 mm for superior physical defense.' },
            { title: 'Modern Tool Resistance', desc: 'Designed specifically to resist high-speed drilling, mechanical force, and modern cutting tools.' },
            { title: 'Heavy-Duty Locking', desc: 'Upgraded 11-lever double-bitted key lock for higher manipulation resistance.' },
            { title: 'Redundant Safety', desc: 'Dual glass relockers provide enhanced anti-tamper protection.' }
        ],
        specs: {
            'Protective Barrier Thickness': '89 mm (3.5”)',
            'Total Door Thickness': 'Approx. 226 mm',
            'Boltwork System': 'Heavy-duty (7 front, 2 top + 2 bottom, 7 rear)',
            'Bolt Diameter': 'Approx. 50 mm',
            'Standard Locking': 'Certified combination lock + 11-lever double-bitted key lock'
        },
        features: [
            { title: 'Reinforced Build', desc: 'Constructed with F80 barrier material plus steel fibers for increased density.' },
            { title: 'Superior Bolt Strength', desc: 'Features larger 50 mm diameter bolts for massive resistance.' },
            { title: 'Dual Glass Relockers', desc: 'Advanced protection mechanism for enhanced anti-tamper security.' }
        ],
        applications: ['Banks & financial institutions', 'Jewellery storage rooms', 'High-value commercial vaults']
    },
    {
        filename: 'single-vault-door-Chubb-Bookroom.html',
        name: 'Chubb Bookroom Door',
        subheading: 'Secure Archive and Record Storage Solution',
        overview: 'The Chubbsafes Bookroom Door is designed for secure archive rooms, record storage, and controlled-access environments. It provides a balance between security, accessibility, and operational convenience.',
        benefits: [
            { title: 'Operational Ease', desc: 'Features a user-friendly operation for daily use.' },
            { title: 'Versatile Access', desc: 'Compatible with strongroom constructions and supports integration with alarm systems.' },
            { title: 'Day Access Control', desc: 'Can include a grille gate (day gate) for ventilation and controlled access.' }
        ],
        specs: {
            'Locking Mechanism': 'Multi-bolt locking mechanism',
            'Standard Locking': 'Combination + key lock options',
            'Optional Security': 'Day gate secured with mortice locks',
            'Construction': 'Durable for high-frequency access'
        },
        features: [
            { title: 'Archive Protection', desc: 'Specifically tailored for document and archive protection.' },
            { title: 'System Integration', desc: 'Supports integration with alarm systems and access control.' },
            { title: 'Ventilation Options', desc: 'Optional day gate allows for airflow while maintaining security.' }
        ],
        applications: ['Record rooms', 'Archive storage', 'Government documentation rooms', 'Corporate file storage']
    },
    {
        filename: 'single-vault-door-Chubb-Centurion.html',
        name: 'Chubb Centurion Door-in-Door',
        subheading: 'Grade V High-Security Certified Vault Door',
        overview: 'The Chubbsafes Centurion Door-in-Door Vault Door (Grade V) is a certified high-security solution combining advanced burglary resistance with operational convenience. The integrated “door-in-door” feature provides controlled access without opening the main vault.',
        benefits: [
            { title: 'Elite Certification', desc: 'Certified to EN 1143-1 Grade V burglary resistance standard.' },
            { title: 'Operational Flexibility', desc: 'Integrated “door-in-door” feature for internal access.' },
            { title: 'Explosive Resistance', desc: 'Optional EX rating for protection against explosives.' },
            { title: 'Advanced Integration', desc: 'Fully compatible with multi-user access systems and time locks.' }
        ],
        specs: {
            'Burglary Grade': 'EN 1143-1 Grade V',
            'Frame Type': 'Armoured door frame',
            'Standard Locking': '1 key lock + 1 combination lock (Grade V–IX)',
            'Optional Locks': 'Electronic locks, time locks, multi-user systems',
            'Special Resistance': 'Explosives (optional), Diamond core drilling (higher grades)'
        },
        features: [
            { title: 'Emergency Access', desc: 'Door-in-Door feature for operational flexibility.' },
            { title: 'Armoured Frame', desc: 'Armoured door frame for additional protection.' },
            { title: 'Grille Gate', desc: 'Optional integrated grille gate.' }
        ],
        applications: ['Bank vaults', 'Bullion storage', 'High-security government facilities', 'Luxury retail vault rooms']
    },
    {
        filename: 'single-vault-door-Promet-EVD1.html',
        name: 'Luxuria EVD1 (Promet)',
        subheading: 'Grade I Certified Security Door for Panic Rooms and Armories',
        overview: 'The Promet EVD1 Security Door is a high-security vault door designed for maximum protection of secure rooms such as panic rooms, safe rooms, and gun rooms. It combines strength and durability with reliable locking technology.',
        benefits: [
            { title: 'Certified Security', desc: 'Certified EN 1143-1 Grade I burglary resistance.' },
            { title: 'Concrete Integration', desc: 'Designed for high-security installations in reinforced concrete walls.' },
            { title: 'Customizable Locks', desc: 'Flexible locking configurations including electronic systems with dual user codes.' },
            { title: 'Wide Opening', desc: 'External hinges allow for 180° opening capability.' }
        ],
        specs: {
            'Model/Grade': 'EVD1 / EN 1143-1 Grade I',
            'Clear Opening': 'Approx. 2000 x 900 mm',
            'Weight': 'Approx. 188 kg',
            'Installation': 'Wall-mounted into reinforced concrete',
            'Standard Locking': 'Class I/A high-security key lock'
        },
        features: [
            { title: 'Electronic Upgrades', desc: 'Optional electronic lock features include time delay and wrong-code lockout protection.' },
            { title: 'Build Quality', desc: 'Heavy-duty steel construction with reinforced door leaf and frame.' },
            { title: 'Finish Options', desc: 'Standard primer-coated finish with optional powder coating in RAL 7035 or RAL 7024.' }
        ],
        applications: ['Safe rooms / panic rooms', 'Bank back offices and cash rooms', 'Gun rooms / armories', 'Luxury residential vault rooms']
    }
];

products.forEach(p => {
    fs.writeFileSync(p.filename, template(p), 'utf-8');
});

console.log('Successfully created templates.');
