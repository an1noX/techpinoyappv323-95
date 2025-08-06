import{c as x,Q as T,r as s,V as _,W as A,j as a,Y as S,Z as j,a1 as L,$ as O,a0 as z,l as R,F as B}from"./index-FgfazPn4.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Y=x("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z=x("SquarePen",[["path",{d:"M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1m0v6g"}],["path",{d:"M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z",key:"ohrbg2"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=x("TrendingDown",[["polyline",{points:"22 17 13.5 8.5 8.5 13.5 2 7",key:"1r2t7k"}],["polyline",{points:"16 17 22 17 22 11",key:"11uiuu"}]]);/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J=x("Truck",[["path",{d:"M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",key:"wrbu53"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["path",{d:"M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",key:"lysw3i"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}]]);var E="Checkbox",[K,U]=T(E),[F,V]=K(E),I=s.forwardRef((e,i)=>{const{__scopeCheckbox:t,name:l,checked:f,defaultChecked:o,required:h,disabled:d,value:b="on",onCheckedChange:m,form:u,...C}=e,[n,y]=s.useState(null),v=_(i,r=>y(r)),g=s.useRef(!1),P=n?u||!!n.closest("form"):!0,[p=!1,w]=A({prop:f,defaultProp:o,onChange:m}),H=s.useRef(p);return s.useEffect(()=>{const r=n==null?void 0:n.form;if(r){const k=()=>w(H.current);return r.addEventListener("reset",k),()=>r.removeEventListener("reset",k)}},[n,w]),a.jsxs(F,{scope:t,state:p,disabled:d,children:[a.jsx(S.button,{type:"button",role:"checkbox","aria-checked":c(p)?"mixed":p,"aria-required":h,"data-state":q(p),"data-disabled":d?"":void 0,disabled:d,value:b,...C,ref:v,onKeyDown:j(e.onKeyDown,r=>{r.key==="Enter"&&r.preventDefault()}),onClick:j(e.onClick,r=>{w(k=>c(k)?!0:!k),P&&(g.current=r.isPropagationStopped(),g.current||r.stopPropagation())})}),P&&a.jsx(X,{control:n,bubbles:!g.current,name:l,value:b,checked:p,required:h,disabled:d,form:u,style:{transform:"translateX(-100%)"},defaultChecked:c(o)?!1:o})]})});I.displayName=E;var N="CheckboxIndicator",M=s.forwardRef((e,i)=>{const{__scopeCheckbox:t,forceMount:l,...f}=e,o=V(N,t);return a.jsx(L,{present:l||c(o.state)||o.state===!0,children:a.jsx(S.span,{"data-state":q(o.state),"data-disabled":o.disabled?"":void 0,...f,ref:i,style:{pointerEvents:"none",...e.style}})})});M.displayName=N;var X=e=>{const{control:i,checked:t,bubbles:l=!0,defaultChecked:f,...o}=e,h=s.useRef(null),d=O(t),b=z(i);s.useEffect(()=>{const u=h.current,C=window.HTMLInputElement.prototype,y=Object.getOwnPropertyDescriptor(C,"checked").set;if(d!==t&&y){const v=new Event("click",{bubbles:l});u.indeterminate=c(t),y.call(u,c(t)?!1:t),u.dispatchEvent(v)}},[d,t,l]);const m=s.useRef(c(t)?!1:t);return a.jsx("input",{type:"checkbox","aria-hidden":!0,defaultChecked:f??m.current,...o,tabIndex:-1,ref:h,style:{...e.style,...b,position:"absolute",pointerEvents:"none",opacity:0,margin:0}})};function c(e){return e==="indeterminate"}function q(e){return c(e)?"indeterminate":e?"checked":"unchecked"}var D=I,$=M;const Q=s.forwardRef(({className:e,...i},t)=>a.jsx(D,{ref:t,className:R("peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",e),...i,children:a.jsx($,{className:R("flex items-center justify-center text-current"),children:a.jsx(B,{className:"h-4 w-4"})})}));Q.displayName=D.displayName;export{Q as C,Y as S,J as T,Z as a,G as b};
//# sourceMappingURL=checkbox-De7F5xfH.js.map
