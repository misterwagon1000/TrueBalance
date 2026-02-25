@@ .. @@
 import { FinanceApp } from '../components/FinanceApp';
+import { Header } from '../components/layout/Header';
+import { SubscriptionStatus } from '../components/subscription/SubscriptionStatus';
+import { authService } from '../lib/auth';
+import type { User } from '@supabase/supabase-js';
 
 export function HomePage() {
   const container = document.createElement('div');
-  container.className = 'min-h-screen bg-gray-50';
+  container.className = 'min-h-screen bg-gray-50';
+  
+  let user: User | null = null;
+  
+  async function loadUser() {
+    const { user: currentUser } = await authService.getUser();
+    user = currentUser;
+    render();
+  }
+  
+  function render() {
+    container.innerHTML = '';
+    
+    container.appendChild(Header());
+    
+    const main = document.createElement('main');
+    main.className = 'max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8';
+    
+    if (user) {
+      const subscriptionContainer = document.createElement('div');
+      subscriptionContainer.className = 'mb-6';
+      subscriptionContainer.appendChild(SubscriptionStatus());
+      main.appendChild(subscriptionContainer);
+    }
+    
+    main.appendChild(FinanceApp());
+    container.appendChild(main);
+  }
+  
+  loadUser();
   
-  container.appendChild(FinanceApp());
+  // Listen for auth state changes
+  authService.onAuthStateChange((newUser) => {
+    user = newUser;
+    render();
+  });
   
   return container;
 }