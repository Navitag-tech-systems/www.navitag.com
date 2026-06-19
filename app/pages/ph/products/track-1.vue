<script setup lang="ts">
definePageMeta({ layout: 'ph' })

useSeoMeta({
  title: 'Navitag TRACK-1 — GPS Tracking Made Easy | Philippines',
  description: 'The Navitag TRACK-1 is a plug-and-play GPS tracker with real-time global tracking, a free mobile app & fleet dashboard, free on-site installation, and lifetime warranty. No external SIM. No monthly due dates. Just pay-as-you-go.',
  ogTitle: 'Navitag TRACK-1 — GPS Tracking Made Easy | Philippines',
  ogDescription: 'Plug-and-play GPS tracker with real-time global tracking, free app, free on-site installation, and lifetime warranty. No SIM, no contracts.',
  ogUrl: 'https://navitag.com/ph/products/track-1',
})

useHead({
  link: [
    { rel: 'canonical', href: 'https://navitag.com/ph/products/track-1' },
    // Funnel Sans + Font Awesome load globally (nuxt.config). Satoshi is only
    // used on this page's display headings — loaded here from Fontshare.
    { rel: 'preconnect', href: 'https://api.fontshare.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap' },
  ],
})

const root = ref<HTMLElement | null>(null)
const chatBubbleClosed = ref(false)
let cancelled = false
let observer: IntersectionObserver | null = null

function scrollToAntipain(e: Event) {
  // Smooth-scroll to the section instead of an instant hash jump. The pixel
  // ProductCTAClick still fires via the plugin's delegated document listener
  // (preventDefault doesn't stop propagation). Honor reduced-motion.
  const el = document.getElementById('antipain')
  if (!el) return
  e.preventDefault()
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

function closeChatBubble() {
  chatBubbleClosed.value = true
  try {
    sessionStorage.setItem('speechBubbleClosed', 'true')
  }
  catch { /* sessionStorage unavailable — ignore */ }
}

onMounted(() => {
  const { $fbq } = useNuxtApp()
  $fbq?.('ViewContent', {
    content_name: 'product_track1_ph',
    content_category: 'product',
    content_ids: ['track-1'],
    content_type: 'product',
    audience: 'b2c',
  })

  // Restore the chat bubble's dismissed state for this session.
  try {
    if (sessionStorage.getItem('speechBubbleClosed') === 'true') chatBubbleClosed.value = true
  }
  catch { /* ignore */ }

  const scope: ParentNode = root.value ?? document
  const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Typewriter effect for the hero ([data-typewriter] elements). The loop is
  // cancellable so it stops cleanly when the user navigates away (SPA).
  async function typewrite(el: HTMLElement) {
    const words = (el.dataset.typewriter ?? '').split(',')
    const speed = 100
    const delay = 1100
    const toggle = () => el.classList.toggle('typing')

    while (!cancelled) {
      for (const word of words) {
        if (cancelled) return
        await wait(delay)
        toggle()
        for (const letter of word.split('')) {
          if (cancelled) return
          el.textContent += letter
          await wait(speed)
        }
        toggle()
        await wait(delay)
        toggle()
        while (el.textContent && el.textContent.length !== 0) {
          if (cancelled) return
          el.textContent = el.textContent.slice(0, -1)
          await wait(speed)
        }
        toggle()
      }
    }
  }

  scope.querySelectorAll<HTMLElement>('[data-typewriter]').forEach((el) => { typewrite(el) })

  // Scroll-reveal for feature cards.
  observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view')
        obs.unobserve(entry.target)
      }
    })
  }, { root: null, rootMargin: '0px', threshold: 0.2 })

  scope.querySelectorAll('.featureContainer').forEach(c => observer!.observe(c))
})

onBeforeUnmount(() => {
  cancelled = true
  observer?.disconnect()
})
</script>

<template>
  <div ref="root" class="track1">
    <div id="hero-mobile" style="background-image: url('https://photos.navitag.net/dump/assets/hero-image-mobile-v4.webp');background-position: center center;background-size: cover;aspect-ratio:1390/2000;">
      <div style="padding: 8vw 0 0 6.5vw;font-size: 9.5vw;font-weight: 700;line-height: 1;color:white;font-family:Funnel Sans,sans-serif;">
        <div style="line-height:1.3;font-family:'Satoshi',sans-serif;font-weight:800;padding-bottom:0.15vw;">GPS TRACKING<br>MADE EASY</div>
        <div style="line-height:1.5;font-size: 6vw;font-weight: 400;">
          <div style="margin-bottom:16px;">Secure your <span data-typewriter="VEHICLE,FAMILY,BUSINESS,FLEET,CARGO,LOVED ONES"></span><br>with the Navitag TRACK-1.</div>
          <NuxtLink
            to="/shop/product/track-1"
            class="mainBtn"
            data-pixel-event="Custom"
            data-pixel-custom-name="ProductCTAClick"
            data-pixel-audience="b2c"
            data-pixel-content-category="product"
            data-pixel-content-name="track1_ph_hero_mobile"
          >
            <span style="color:white; text-decoration:none;">Buy Now</span>
          </NuxtLink>
          <a
            href="#antipain"
            class="learnBtn"
            @click="scrollToAntipain"
            data-pixel-event="Custom"
            data-pixel-custom-name="ProductCTAClick"
            data-pixel-audience="b2c"
            data-pixel-content-category="product"
            data-pixel-content-name="track1_ph_learn_more"
          ><span style="color:white;">Learn More</span></a>
        </div>
      </div>
    </div>

    <div id="hero-desktop" style="background-image: url('https://photos.navitag.net/dump/assets/hero-image-v2.webp');background-position: center center;background-size: cover;aspect-ratio: 2.1 / 1;align-content:center;">
      <div style="padding: 0 0 0 6.5vw;font-size: 4.65vw;font-weight: 700;line-height: 1;color:white;font-family:Funnel Sans,sans-serif;">
        <div style="line-height:1.3;font-family:'Satoshi',sans-serif;font-weight:800;padding-bottom:0.15vw;">GPS TRACKING<br>MADE EASY</div>
        <div style="line-height:1.5;font-size: 2.45vw;width: 41%;font-weight: 400;">
          <div style="margin-bottom:12px;">Secure your <span data-typewriter="VEHICLE,FAMILY,BUSINESS,FLEET,CARGO,LOVED ONES"></span><br>with the Navitag TRACK-1.</div>
          <NuxtLink
            to="/shop/product/track-1"
            class="mainBtn"
            data-pixel-event="Custom"
            data-pixel-custom-name="ProductCTAClick"
            data-pixel-audience="b2c"
            data-pixel-content-category="product"
            data-pixel-content-name="track1_ph_hero_desktop"
          >
            <span style="color:white;">Buy Now</span>
          </NuxtLink>
          <a
            href="#antipain"
            class="learnBtn"
            @click="scrollToAntipain"
            data-pixel-event="Custom"
            data-pixel-custom-name="ProductCTAClick"
            data-pixel-audience="b2c"
            data-pixel-content-category="product"
            data-pixel-content-name="track1_ph_learn_more"
          ><span style="color:white;">Learn More</span></a>
        </div>
      </div>
    </div>

    <div id="useCases" style="margin:36px 0 16px;">
      <div style="text-align:center;font-size:min(1.65rem, max(4vw, 1.25rem));font-weight:600;font-family:Satoshi,sans-serif;">SMART GPS TRACKING FOR&nbsp;EVERY&nbsp;NEED</div>
      <div id="useCasesFlexBox" style="display:flex;padding:24px 16px;align-items:flex-start;flex-wrap:wrap;gap:24px;">
        <div style="min-width:0;text-align:center;flex:1;"><img style="width:100%;" src="https://photos.navitag.net/dump/assets/use-case-family.webp" alt="Family safety and security"><div class="bodyText">Family Safety and&nbsp;Security</div></div>
        <div style="min-width:0;text-align:center;flex:1;"><img style="width:100%;" src="https://photos.navitag.net/dump/assets/use-case-small-business-v2.webp" alt="Small business operations"><div class="bodyText">Small Business Operations</div></div>
        <div style="min-width:0;text-align:center;flex:1;"><img style="width:100%;" src="https://photos.navitag.net/dump/assets/use-case-fleet-management.webp" alt="Enterprise fleet management"><div class="bodyText">Enterprise Fleet Management</div></div>
      </div>
    </div>

    <div id="antipain" class="section">
      <div>
        <div style="text-align:center;"><img src="https://photos.navitag.net/dump/assets/app-on-dashboard.webp" style="box-shadow:0 .5rem 1rem #00000026!important;border-radius: 20px; width:100%;margin:16px 0;" alt="Navitag app on a car dashboard"></div>
        <div>
          <h2 class="headerText"><div class="preheader">SKIP THE SALES TALK</div>Start Tracking Today</h2>
          <div class="bodyText">
            <div style="margin-bottom:0.65em;">Protecting your vehicle shouldn't have to be complicated. Traditional GPS providers still rely on tedious sales calls and manual billing that just waste your time and energy.</div>
            <div>Backed by over six years of industry leadership, we cut the complexity out of vehicle security. The result is a high-tech, plug-and-play tracker built for every kind of vehicle owner.</div>
            <div style="margin-top:20px;">
              <NuxtLink
                to="/shop/product/track-1"
                class="subBtn"
                data-pixel-event="Custom"
                data-pixel-custom-name="ProductCTAClick"
                data-pixel-audience="b2c"
                data-pixel-content-category="product"
                data-pixel-content-name="track1_ph_skip_sales"
              >
                <span style="color:white; text-decoration:none;">Start Tracking</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="margin:36px 0 16px;">
      <div style="text-align:center;font-size:min(1.65rem, max(4vw, 1.25rem));font-weight:600;font-family:Satoshi,sans-serif;">TRUSTED BY BUSINESSES<br>SERIOUS ABOUT SECURITY</div>
      <div id="clientLogos" style="display:flex;padding:12px;align-items:center;flex-wrap:wrap;">
        <div style="min-width:0;text-align:center;"><img style="height:100%;margin-top:1vw;" src="https://photos.navitag.net/dump/logos/soen-logo.webp" alt="Soen" loading="lazy"></div>
        <div style="min-width:0;text-align:center;"><img style="height:100%;" src="https://photos.navitag.net/dump/logos/manila-creamery-logo.webp" alt="Manila Creamery" loading="lazy"></div>
        <div style="min-width:0;text-align:center;"><img style="height:100%;" src="https://photos.navitag.net/dump/logos/massive-logo.webp" alt="Massive" loading="lazy"></div>
        <div style="min-width:0;text-align:center;"><img style="height:100%;" src="https://photos.navitag.net/dump/logos/fuji-logo.webp" alt="Fuji" loading="lazy"></div>
      </div>
    </div>

    <div style="background:#F2F3F7">
      <div id="solutionHeader1">
        <h2 class="headerText" style="padding:44px 0 0;text-align:center;margin-bottom:0;"><div class="preheader">INTRODUCING &mdash;</div>The Navitag TRACK-1</h2>
        <div class="bodyText" style="text-align:center;padding: 4px 32px 0;">Finally, a GPS tracking device you can start using right out of the box. No sales reps to call. No monthly due dates. Just a quick installation and a simple, pay-as-you-go model.</div>
      </div>
      <div style="display:flex;margin:0 auto; width:calc(100% - 32px); max-width: 1100px;" class="trustSignalMatrix">
        <div style="flex:4"><img src="https://photos.navitag.net/dump/assets/navitag-device-parts-v2.webp" style="width:100%;filter: brightness(1.2); mix-blend-mode: multiply;" loading="lazy" alt="Navitag TRACK-1 device parts"></div>
        <div style="flex:5; align-content:center;padding-bottom:60px;">
          <div id="solutionHeader2">
            <h2 class="headerText" style="padding:44px 0 0;"><div class="preheader">INTRODUCING &mdash;</div>The Navitag TRACK-1</h2>
            <div class="bodyText" style="margin-bottom:20px;padding-top:8px;">Finally, a GPS tracking device you can start using right out of the box. No sales reps to call. No monthly due dates. Just a quick installation and a simple, pay-as-you-go model.</div>
          </div>
          <div style="align-content:center;display:flex;gap:4px;flex-direction:column;" class="trustSignalContainer">
            <div>
              <div class="trustSignal"><div><img class="trustSignalIcon" src="https://photos.navitag.net/dump/assets/global-coverage.webp" alt="" loading="lazy"></div><div>Real-Time Global GPS Tracking</div></div>
              <div class="trustSignal"><div><img class="trustSignalIcon" src="https://photos.navitag.net/dump/assets/mobile-app.webp" alt="" loading="lazy"></div><div>Free Mobile App &amp; Fleet Dashboard</div></div>
            </div>
            <div>
              <div class="trustSignal"><div><img class="trustSignalIcon" src="https://photos.navitag.net/dump/assets/free-installation.webp" alt="" loading="lazy"></div><div>Free On-Site Installation Service</div></div>
              <div class="trustSignal"><div><img class="trustSignalIcon" src="https://photos.navitag.net/dump/assets/universal-compatibility.webp" alt="" loading="lazy"></div><div>Universal Vehicle Compatibility</div></div>
            </div>
            <div>
              <div class="trustSignal"><div><img class="trustSignalIcon" src="https://photos.navitag.net/dump/assets/warranty.webp" alt="" loading="lazy"></div><div style="height:100%;">Lifetime Product Warranty</div></div>
              <div class="trustSignal"><div><img class="trustSignalIcon" src="https://photos.navitag.net/dump/assets/engineered-in-usa.webp" alt="" loading="lazy"></div><div style="height:100%;">Engineered in Wyoming, USA</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <div id="features" class="section">
        <h2 class="headerText" style="text-align:center;margin-top:16px;"><div class="preheader">KEY FEATURES</div>Our Core Technology</h2>

        <div class="featureContainer">
          <div><img src="https://photos.navitag.net/dump/assets/feature-collision-alert.webp" alt="Collision detection" loading="lazy"></div>
          <div class="bodyText"><span class="tagLabel">SAFETY</span><h3>Detect High-Impact Collisions</h3>Receive alerts for possible road emergencies when a high-impact crash is detected.</div>
        </div>

        <div class="featureContainer">
          <div><img src="https://photos.navitag.net/dump/assets/feature-historical-playback.webp" alt="Location history playback" loading="lazy"></div>
          <div class="bodyText"><span class="tagLabel">MONITORING</span><h3>Replay Location History</h3>Review past trips and see location history up to 6 months* in the past.</div>
        </div>

        <div class="featureContainer">
          <div><img src="https://photos.navitag.net/dump/assets/feature-locked-parking-mode-v2.webp" alt="Parking lock mode" loading="lazy"></div>
          <div class="bodyText"><span class="tagLabel">ANTI-THEFT</span><h3>Parking "Lock" Mode</h3>Get notified when your parked vehicle is suddenly moving while set to Lock Mode.</div>
        </div>

        <div class="featureContainer">
          <div><img src="https://photos.navitag.net/dump/assets/feature-geofencing.webp" alt="Geofencing" loading="lazy"></div>
          <div class="bodyText"><span class="tagLabel">AUTOMATION</span><h3>Geofencing</h3>Create virtual zones to trigger notifications whenever your vehicle enters or exits.</div>
        </div>

        <div class="featureContainer">
          <div><img src="https://photos.navitag.net/dump/assets/feature-emergency-contacts.webp" alt="Emergency contacts" loading="lazy"></div>
          <div class="bodyText"><span class="tagLabel">EMERGENCY RESPONSE</span><h3>Emergency Contacts</h3>Invite and enroll contacts that will be notified in potential vehicle emergency situations.</div>
        </div>

        <div class="featureContainer">
          <div><img src="https://photos.navitag.net/dump/assets/feature-share-location-link.webp" alt="Share location link" loading="lazy"></div>
          <div class="bodyText"><span class="tagLabel">PEACE OF MIND</span><h3>Share Location Link</h3>Share a link that lets others temporarily see your vehicle's live location on a map.</div>
        </div>
      </div>
    </div>

    <div style="background:#F2F3F7;padding: 16px 8px 44px;">
      <h2 class="headerText" style="text-align:center;margin:44px 0 32px;"><div class="preheader">THE NAVITAG ADVANTAGE</div>Why Choose Us?</h2>
      <table id="comparisonTable">
        <tbody>
          <tr><td>NAVITAG TRACK-1</td><td>OTHER BRANDS &amp;<br>GENERIC TRACKERS</td></tr>
          <tr><td><div><i class="fa-solid fa-sim-card"></i> SIM Card</div><div>No external SIM Card required</div></td><td><div><i class="fa-solid fa-sim-card"></i> SIM Card</div><div>Must buy your own SIM card &amp; data</div></td></tr>
          <tr><td><div><i class="fa-solid fa-satellite-dish"></i> Network</div><div>Multiple networks in 100+ countries</div></td><td><div><i class="fa-solid fa-satellite-dish"></i> Network</div><div>Single network only, no roaming</div></td></tr>
          <tr><td><div><i class="fa-solid fa-map-location-dot"></i> Tracking Experience</div><div>Live map tracking on web &amp; mobile app</div></td><td><div><i class="fa-solid fa-map-location-dot"></i> Tracking Experience</div><div>Wait for SMS-reply of vehicle location pin</div></td></tr>
          <tr><td><div><i class="fa-solid fa-clock-rotate-left"></i> Location History</div><div>Up to 6 months replayable location history</div></td><td><div><i class="fa-solid fa-clock-rotate-left"></i> Location History</div><div>No location history</div></td></tr>
          <tr><td><div><i class="fa-solid fa-headset"></i> Customer Support</div><div>24/7 customer support hotline</div></td><td><div><i class="fa-solid fa-headset"></i> Customer Support</div><div>No after-sales support</div></td></tr>
        </tbody>
      </table>
      <div style="text-align:center;">
        <div style="margin-top:28px;">
          <NuxtLink
            to="/shop/product/track-1"
            class="subBtn"
            data-pixel-event="Custom"
            data-pixel-custom-name="ProductCTAClick"
            data-pixel-audience="b2c"
            data-pixel-content-category="product"
            data-pixel-content-name="track1_ph_comparison"
          >
            <span style="color:white; text-decoration:none;">Get the TRACK-1</span>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="section" style="background:white;padding:44px 0;">
      <h2 class="headerText" style="text-align:center;margin:44px 0 32px;"><div class="preheader">GETTING STARTED</div>Setting Up the TRACK-1</h2>
      <div id="howToSteps">
        <div>
          <div><img src="https://photos.navitag.net/dump/assets/scan-qr-v2.webp" style="border-radius:16px;width:100%;" alt="Scan the QR code inside the box" loading="lazy"></div>
          <div><div class="howToNumber">01</div><div class="howToHeader">Link your account</div><div class="howToBody">Download and install the Navitag app and scan the QR Code <strong><u><i>inside</i></u></strong> the box.</div></div>
        </div>

        <div>
          <div><img src="https://photos.navitag.net/dump/assets/installer.webp" style="border-radius:16px;width:100%;" alt="Install the TRACK-1" loading="lazy"></div>
          <div><div class="howToNumber">02</div><div style="color:#F28C38!important" class="howToHeader">Install the TRACK-1</div><div class="howToBody">Connect the TRACK-1 to your vehicle's fuse box or find an installer <NuxtLink to="/ph/distribution">here</NuxtLink>.</div></div>
        </div>

        <div>
          <div><img src="https://photos.navitag.net/dump/assets/start-tracking.webp" style="border-radius:16px;width:100%;" alt="Start tracking" loading="lazy"></div>
          <div><div class="howToNumber">03</div><div class="howToHeader">Start tracking</div><div class="howToBody">See your vehicle's real-time location on the Navitag app</div></div>
        </div>
      </div>
    </div>

    <div class="section" id="prefooter">
      <h2 class="headerText" style="padding:44px 0 0;text-align:center;margin-bottom:0;"><div class="preheader">READY TO SECURE YOUR ASSETS?</div>Start Tracking Today</h2>
      <div style="text-align:center;margin-top:20px;">
        <NuxtLink
          to="/shop/product/track-1"
          class="subBtn"
          data-pixel-event="Custom"
          data-pixel-custom-name="ProductCTAClick"
          data-pixel-audience="b2c"
          data-pixel-content-category="product"
          data-pixel-content-name="track1_ph_prefooter"
        >
          <span style="color:white; text-decoration:none;">Order Now</span>
        </NuxtLink>
      </div>
    </div>

    <div id="chatProfile" style="position: fixed; bottom: 20px; right: 20px; z-index: 300; height: 60px;">
      <div v-show="!chatBubbleClosed" id="speechBubbleWrapper" style="position: absolute;top: -87%;right: 30px;width: 95px;">
        <a
          href="https://www.messenger.com/t/1677175202317983"
          target="_blank"
          rel="noopener noreferrer"
          style="text-decoration:none;"
          data-pixel-event="Contact"
          data-pixel-audience="b2c"
          data-pixel-content-category="contact"
          data-pixel-lead-type="support_chat"
          data-pixel-content-name="track1_ph_chat_bubble"
        >
          <div id="speechBubble" style="color:black;background: white;padding: 4px 10px;font-size: 0.8rem;box-shadow: 0 0 8px -2px rgba(0,0,0,0.35);border-radius: 1em 1em 0 1em;">
            Hi, how can we help you?
          </div>
        </a>
        <span class="close-btn" role="button" tabindex="0" aria-label="Close" @click="closeChatBubble" @keydown.enter="closeChatBubble">&times;</span>
      </div>

      <a
        href="https://www.messenger.com/t/1677175202317983"
        target="_blank"
        rel="noopener noreferrer"
        style="display: block;"
        data-pixel-event="Contact"
        data-pixel-audience="b2c"
        data-pixel-content-category="contact"
        data-pixel-lead-type="support_chat"
        data-pixel-content-name="track1_ph_chat_icon"
      >
        <img alt="Chat Support Profile Icon" src="https://photos.navitag.net/dump/assets/navitag-chat-profile.webp" style="height: 60px; width: 60px; border-radius: 30px; box-shadow: 0 0 8px -2px #000;">
      </a>
    </div>
  </div>
</template>

<style scoped>
#comparisonTable {
  margin: 0 auto;
  max-width: 650px;
  /* Tailwind preflight forces border-collapse:collapse, which kills the
     per-cell border-radius and merges the 3px #F2F3F7 borders into shared
     lines. Restore the original separate model so the rounded white cells
     keep their gaps. */
  border-collapse: separate;
  border-spacing: 2px;
}

.howToHeader {
  color: #0076F5;
  font-weight: 500;
  font-size: 1.25rem;
  line-height: 1.15;
}

#trustSubBtn {
  text-align: center;
}

.howToNumber {
  /* Centered circle. The original used `display: inline-box` (not a valid CSS
     value) so it fell back to block + mismatched width/height = a stretched
     pill. Flex-center the number inside an equal-sided, fully-rounded box. */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  margin: 0 auto 4px;
  font-weight: 100;
  font-size: 1.3rem;
  line-height: 1;
  border: 1.5px solid black;
  border-radius: 999px;
}

.howToBody {
  font-size: min(0.9rem, 4.15vw);
}

#howToSteps {
  max-width: 1000px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

#howToSteps > div {
  flex: 1;
  padding: 0 16px;
  display: flex;
  gap: 10px;
}

#howToSteps > div > div {
  flex: 1;
  display: flex;
  flex-direction: column;
  text-align: center;
  align-content: center;
  justify-content: center;
}

#howToSteps > div:nth-child(even) {
  flex-direction: row-reverse;
}

#howToSteps img {
  aspect-ratio: 1/1.171;
  object-fit: cover;
}

.subBtn, .mainBtn {
  font-weight: 500;
  font-size: 1rem;
  text-decoration: none;
  background: #0076F5;
  border-radius: 40px;
  border: 1.5px solid #0076F5;
  padding: 8px 16px;
  line-height: 1.85;
}

.learnBtn {
  margin-left: 12px;
  border: none;
  border-bottom: 1px solid white;
  background: transparent;
  border-radius: 0;
  padding: 0;
  display: inline-block;
  font-weight: 400;
  line-height: 1.35;
  transform: translateY(-5%);
  font-size: 0.9rem;
  opacity: 0.94;
  text-decoration: none;
}

#comparisonTable, #comparisonTable td {
  border: 3px solid #F2F3F7;
}

#comparisonTable tr:first-child {
  text-align: center;
  font-family: 'Satoshi', sans-serif !important;
  font-weight: 700;
  font-size: min(1.2rem, 3.5vw);
}

#comparisonTable td {
  width: 50%;
}

#comparisonTable tr:not(:first-child) {
  font-family: 'Funnel Sans', sans-serif;
}

#comparisonTable tr:not(:first-child) td {
  background: white;
  padding: 8px 16px 8px 12px;
  border-radius: 16px;
  font-weight: 600;
  vertical-align: top;
}

#comparisonTable tr:not(:first-child) td:first-child > div:last-child {
  color: #398833;
}

#comparisonTable tr:not(:first-child) td:last-child > div:last-child {
  color: #CB2639;
}

#comparisonTable tr:not(:first-child) td > div:first-child {
  font-weight: 700;
  font-size: min(1rem, 5vw);
}

#comparisonTable tr:not(:first-child) td > div:last-child {
  font-size: min(1.35rem, 5.75vw);
  padding-bottom: 1rem;
}

[data-typewriter] {
  color: #F28C38;
  height: 1em;
  border-right: 2px solid transparent;
  padding-right: 4px;
  font-weight: 600;
}

[data-typewriter]:not(.typing) {
  animation: blink-caret 1.1s step-end infinite;
}

@keyframes blink-caret {
  0%,
  100% {
    border-color: transparent;
  }

  50% {
    border-color: #F28C38;
  }
}

.close-btn {
  /* Flex-center the × so it stays centered regardless of box model — the
     original padding/line-height sizing assumed content-box, which Tailwind's
     border-box preflight breaks. */
  position: absolute;
  top: 0;
  right: -0.6em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.1em;
  height: 1.1em;
  background: white;
  border-radius: 50%;
  font-size: 1rem;
  line-height: 1;
  box-shadow: 0 0 8px -2px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  color: #000;
  user-select: none;
}

#speechBubble:before {
  content: "";
  background: white;
  width: 1.2em;
  z-index: 1;
  height: 1.2em;
  position: absolute;
  bottom: -1.19em;
  color: rgba(0, 0, 0.86);
  border-radius: 0 0 0 -1em;
  right: 0;
  background: radial-gradient(circle at bottom left, transparent calc(1.2em - 1px), rgba(0, 0, 0, 0.15) 1px, #FFFFFF 1.2em);
  filter: blur(0.2px);
}

a:visited {
  color: inherit !important;
}

/* Set the page font on the root and let it inherit, rather than `* { … }`.
   Vue scopes `*` to `*[data-v]` (specificity 0,1,0), which would tie — and
   beat, by source order — Font Awesome's `.fa-solid { font-family }` rule and
   blank out the icon glyphs. Inheritance is correctly overridden by FA's own
   font-family declaration, so icons render and everything else gets Funnel Sans. */
.track1 {
  font-family: Funnel Sans, sans-serif;
  /* Original standalone had a white <body>; the ph layout's beige
     (bg-navitag-bg) would otherwise show through sections with no
     background of their own. Restore white for this page's content. */
  background: #fff;
}

#hero-desktop {
  display: none;
}

.section {
  padding: 16px 16px 32px;
}

#antipain {
  background: linear-gradient(70deg, #F2F5F9, #F2F5F9, #FAFAFA, #F7F4EF, #F7EADF, #F7EADF);
}

#prefooter {
  background: url('https://photos.navitag.net/dump/assets/mobile-pre-footer.webp') bottom center / contain no-repeat #EEF5FB;
  padding-bottom: 88vw;
}

#bottomCTA {
  background: url('https://photos.navitag.net/dump/assets/map-illustration.webp') center 102% / 100% auto no-repeat, linear-gradient(70deg, #DFE8F0, #F2F5F9, #FAFAFA, #F7F4EF, #F7EADF);
  padding-bottom: 81vw;
}

#antipain > div {
  display: flex;
  flex-direction: column-reverse;
  gap: 12px;
}

#antipain > div > div:last-child {
  padding-top: 32px;
}

#antipain > div > div {
  align-content: center;
}

#antipain > div > div > img {
  aspect-ratio: 1/1;
  object-fit: cover;
  object-position: 0% 32%;
}

.bodyText {
  font-size: 1.2rem;
  line-height: 1.65;
  align-content: center;
}

.headerText {
  font-size: max(8vw, 36px);
  line-height: 1.15;
  font-weight: 700;
}

.preheader {
  font-family: 'Satoshi', sans-serif;
  font-size: min(22px, max(2.5vw, 18px));
  font-weight: 700;
  letter-spacing: 1px;
}

.featureContainer {
  display: flex;
  flex-direction: column;
  gap: 0;
}

div:has(> #features) {
  background: white;
  padding: 24px 0 60px;
}

#features {
  margin: 0 auto;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

h2 {
  margin: 0 0 12px;
  padding: 0;
}

h3 {
  margin: 0 0 4px;
  padding: 0;
  position: relative;
  line-height: 1.35;
  font-weight: 500;
}

#clientLogos {
  margin: 16px 4px;
  gap: 12px;
}

#clientLogos > div {
  flex: 1 1 calc(50% - 12px);
  margin-bottom: 12px;
}

#clientLogos > div img {
  /* inline-block so the parent's text-align:center keeps the logo centered;
     Tailwind's preflight forces img { display:block } which would left-align it. */
  display: inline-block;
  max-height: auto;
  max-width: 80%;
}

#trust-signals {
  margin: 12px 0;
}

#useCasesFlexBox {
  flex-direction: column;
}

.trustSignal {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1vw;
  text-align: center;
  font-weight: 500;
  background: white;
  border-radius: 8px;
  box-shadow: 0 0rem 1rem rgb(0 0 0 / 6%);
}

.trustSignal > div:not(:has(> img)) {
  align-content: center;
  font-size: min(4vw, 1rem);
  height: auto;
  flex: 4;
}

.trustSignal > div:has(> img) {
  flex: 2;
  text-align: center;
}

.trustSignalIcon {
  display: inline-block;
  height: 23vw;
  filter: brightness(1.2);
  mix-blend-mode: multiply;
}

.trustSignalMatrix {
  flex-direction: column;
}

.trustSignalContainer > div {
  align-content: center;
  flex: 1;
  display: flex;
  gap: 4px;
}

#solutionHeader2 {
  display: none;
}

.trustSignalContainer table, .trustSignalContainer th, .trustSignalContainer td {
  border: none !important;
  border-collapse: collapse;
}

@media screen and (min-width: 576px) {
  #prefooter {
    background: url('https://photos.navitag.net/dump/assets/desktop-prefooter.webp') bottom center / contain no-repeat, linear-gradient(70deg, #E5F1F9, #F2F5F9, #F7EADF);
    padding-bottom: 31.5vw;
  }

  .mainBtn {
    padding: 0.5vw 1.5vw;
    margin-top: 20px;
    font-size: 1.2rem;
  }

  #trustSubBtn {
    width: 75%;
    float: right;
    text-align: left;
  }

  #trustSubBtn > a {
    left: -25%;
    position: relative;
  }

  .trustSignalContainer {
    flex-direction: row;
  }

  .trustSignalMatrix {
    flex-direction: row;
  }

  #howToSteps {
    flex-direction: row;
  }

  #howToSteps > div {
    flex-direction: column !important;
  }

  #howToSteps > div > div {
    justify-content: start;
  }

  .trustSignal > div:not(:has(> img)) {
    font-size: min(2vw, 1.2rem);
  }

  .featureContainer:nth-child(odd) {
    flex-direction: row;
  }

  #clientLogos > div {
    flex: auto;
  }

  #clientLogos > div img {
    max-height: min(80px, 10vw);
  }

  #clientLogos > div img[src*="soen"] {
    max-height: min(60px, 7.5vw);
  }

  #clientLogos > div img[src*="creamery"] {
    max-height: min(96px, 12vw);
  }

  #clientLogos {
    gap: 12px;
  }

  .featureContainer:nth-child(even) {
    flex-direction: row-reverse;
  }

  .featureContainer {
    align-content: center;
    gap: 24px;
  }

  .featureContainer div {
    flex: 1;
  }

  #hero-desktop {
    display: block;
  }

  #hero-mobile {
    display: none;
  }

  #antipain > div {
    flex-direction: row !important;
    padding-top: 32px;
    padding-bottom: 32px;
    margin: 0 auto;
    max-width: 1000px;
  }

  #antipain > div > div:first-child {
    order: 1;
    width: 33vw;
  }

  #antipain > div > div:last-child {
    order: 0;
    width: 66vw;
    padding-bottom: 32px;
  }

  #antipain > div > div > img {
    aspect-ratio: auto;
    object-fit: auto;
    object-position: auto;
  }

  .section > div {
    padding-right: 16px;
    padding-left: 16px;
  }

  .headerText {
    font-size: min(52px, 5.25vw);
  }

  #antipain > div > div:last-child > div:last-child {
    padding-right: 32px;
  }

  .bodyText {
    font-size: min(1.4rem, 2.5vw);
  }

  #useCasesFlexBox {
    flex-direction: row;
  }

  .trustSignalIcon {
    height: min(84px, 9vw);
  }
}

@media screen and (min-width: 992px) {
  .trustSignalIcon {
    margin-right: 1vw;
  }

  .trustSignal > div:not(:has(> img)) {
    padding-right: 1vw;
  }

  #solutionHeader2 {
    display: block;
  }

  #solutionHeader1 {
    display: none;
  }

  .trustSignal > div:has(> img) {
    min-width: 45%;
  }

  .trustSignal {
    flex-direction: row;
    text-align: left;
    flex: 1;
  }
}

.tagLabel {
  font-size: 0.6em;
  padding: 1px 12px 1px;
  border-radius: 1em;
  font-weight: 500;
  display: inline-block;
  margin-bottom: 8px;
  color: rgba(0, 0, 0, 0.65);

  /* Glass base */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.45) 50%,
    rgba(255, 255, 255, 0.75) 100%
  );
  backdrop-filter: blur(8px) saturate(1.8);
  -webkit-backdrop-filter: blur(8px) saturate(1.8);

  /* Shiny border */
  border: 1px solid rgba(255, 255, 255, 0.6);
  outline: 1px solid rgba(0, 0, 0, 0.06);

  /* Liquid shine highlight */
  box-shadow:
    inset 0 1px 1px rgba(255, 255, 255, 0.9),
    0 1px 6px rgba(0, 0, 0, 0.08);
}

.featureContainer img, #useCases img {
  aspect-ratio: 16/9;
  object-fit: cover;
  box-shadow: 0 .5rem 1rem #00000026 !important;
  border-radius: 20px;
  width: 100%;
  margin: 12px 0;
}

/* 1. Initial hidden state for the container */
.featureContainer {
  opacity: 0;
  transform: translateY(40px);
  /* Custom cubic-bezier for a smooth, "premium" deceleration */
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

/* 2. The visible state triggered by JavaScript */
.featureContainer.in-view {
  opacity: 1;
  transform: translateY(0);
}

/* Slightly delay the text content so the image appears first */
.featureContainer > div {
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s,
              transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s;
  opacity: 0;
  transform: translateY(20px);
}

.featureContainer.in-view > div {
  opacity: 1;
  transform: translateY(0);
}

/* Remove the delay for the image container so it leads the animation */
.featureContainer > div:first-child {
  transition-delay: 0s;
}
</style>
