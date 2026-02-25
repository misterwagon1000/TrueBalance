@@ .. @@
-import { FinanceApp } from './components/FinanceApp';
+import { router } from './router';
 import './style.css';
 
-document.querySelector<HTMLDivElement>('#app')!.appendChild(FinanceApp());
+const app = document.querySelector<HTMLDivElement>('#app')!;
+app.appendChild(router());