### PROJECT OVERVIEW AND STATUS 


### TECH STACK
- NUXT 4, pinia state management, tailwind, Medusajs frontend, Firebase Auth and Analytics, frontawesome

### modules and plugins
- nuxt mcp: https://mcp-toolkit.nuxt.dev/getting-started/introduction
- medusajs frontend: https://github.com/medusajs/medusa-agent-skills/blob/main/plugins/ecommerce-storefront/README.md#installation-with-claude-code


### SITE ROUTE MAPPING
|ROUTE| Description|
|./ | landing page that highlights global brand
|./privay-policy - Global General Privacy policy made for fb login.
|--------|------------|
|./ph/ | - landing page for philippine/SEA/APAC entity and region
|./ph/distribution | - information on where products are sold
|--------|------------|
|./shop/ | - js logic page that will redirect region/coutry specific pages
|./shop/global | - global store build with medusa plugin


### COMPLETED TASKS
- [X] Create a new Nuxt.js Project
- [X] Upload to github


### TODO
- [ ] Generate a More Comprehensive README.md file 
- [ ] Migrate the contents of www-v2 into www-v3 project
- [ ] Try to extract navitag brand colors from www-v2 (Blue and Orange)
- [ ] build reusable ecom components and/or compostables that can be used anywayre in the app (ex: prod search, catalog view)
- [ ] Setup project with firebase authentication and analytics. use the following firebase config:
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBrLi2dDVVZqxz1g-J17khBDzNtSgTPNtM",
  authDomain: "track-navitag-com.firebaseapp.com",
  projectId: "track-navitag-com",
  storageBucket: "track-navitag-com.firebasestorage.app",
  messagingSenderId: "729666105352",
  appId: "1:729666105352:web:fe56f5d9feec132e0ca1bd",
  measurementId: "G-TCCJ0H788E"
};

