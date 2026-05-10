(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function n(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(i){if(i.ep)return;i.ep=!0;const s=n(i);fetch(i.href,s)}})();function f_(t){return t&&t.__esModule&&Object.prototype.hasOwnProperty.call(t,"default")?t.default:t}var Xg={exports:{}},Iu={},Jg={exports:{}},ae={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var Ea=Symbol.for("react.element"),p_=Symbol.for("react.portal"),m_=Symbol.for("react.fragment"),g_=Symbol.for("react.strict_mode"),y_=Symbol.for("react.profiler"),v_=Symbol.for("react.provider"),__=Symbol.for("react.context"),w_=Symbol.for("react.forward_ref"),x_=Symbol.for("react.suspense"),E_=Symbol.for("react.memo"),b_=Symbol.for("react.lazy"),_p=Symbol.iterator;function T_(t){return t===null||typeof t!="object"?null:(t=_p&&t[_p]||t["@@iterator"],typeof t=="function"?t:null)}var Zg={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},e0=Object.assign,t0={};function zs(t,e,n){this.props=t,this.context=e,this.refs=t0,this.updater=n||Zg}zs.prototype.isReactComponent={};zs.prototype.setState=function(t,e){if(typeof t!="object"&&typeof t!="function"&&t!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,t,e,"setState")};zs.prototype.forceUpdate=function(t){this.updater.enqueueForceUpdate(this,t,"forceUpdate")};function n0(){}n0.prototype=zs.prototype;function wh(t,e,n){this.props=t,this.context=e,this.refs=t0,this.updater=n||Zg}var xh=wh.prototype=new n0;xh.constructor=wh;e0(xh,zs.prototype);xh.isPureReactComponent=!0;var wp=Array.isArray,r0=Object.prototype.hasOwnProperty,Eh={current:null},i0={key:!0,ref:!0,__self:!0,__source:!0};function s0(t,e,n){var r,i={},s=null,o=null;if(e!=null)for(r in e.ref!==void 0&&(o=e.ref),e.key!==void 0&&(s=""+e.key),e)r0.call(e,r)&&!i0.hasOwnProperty(r)&&(i[r]=e[r]);var l=arguments.length-2;if(l===1)i.children=n;else if(1<l){for(var u=Array(l),d=0;d<l;d++)u[d]=arguments[d+2];i.children=u}if(t&&t.defaultProps)for(r in l=t.defaultProps,l)i[r]===void 0&&(i[r]=l[r]);return{$$typeof:Ea,type:t,key:s,ref:o,props:i,_owner:Eh.current}}function S_(t,e){return{$$typeof:Ea,type:t.type,key:e,ref:t.ref,props:t.props,_owner:t._owner}}function bh(t){return typeof t=="object"&&t!==null&&t.$$typeof===Ea}function k_(t){var e={"=":"=0",":":"=2"};return"$"+t.replace(/[=:]/g,function(n){return e[n]})}var xp=/\/+/g;function gc(t,e){return typeof t=="object"&&t!==null&&t.key!=null?k_(""+t.key):e.toString(36)}function xl(t,e,n,r,i){var s=typeof t;(s==="undefined"||s==="boolean")&&(t=null);var o=!1;if(t===null)o=!0;else switch(s){case"string":case"number":o=!0;break;case"object":switch(t.$$typeof){case Ea:case p_:o=!0}}if(o)return o=t,i=i(o),t=r===""?"."+gc(o,0):r,wp(i)?(n="",t!=null&&(n=t.replace(xp,"$&/")+"/"),xl(i,e,n,"",function(d){return d})):i!=null&&(bh(i)&&(i=S_(i,n+(!i.key||o&&o.key===i.key?"":(""+i.key).replace(xp,"$&/")+"/")+t)),e.push(i)),1;if(o=0,r=r===""?".":r+":",wp(t))for(var l=0;l<t.length;l++){s=t[l];var u=r+gc(s,l);o+=xl(s,e,n,u,i)}else if(u=T_(t),typeof u=="function")for(t=u.call(t),l=0;!(s=t.next()).done;)s=s.value,u=r+gc(s,l++),o+=xl(s,e,n,u,i);else if(s==="object")throw e=String(t),Error("Objects are not valid as a React child (found: "+(e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)+"). If you meant to render a collection of children, use an array instead.");return o}function Qa(t,e,n){if(t==null)return t;var r=[],i=0;return xl(t,r,"","",function(s){return e.call(n,s,i++)}),r}function I_(t){if(t._status===-1){var e=t._result;e=e(),e.then(function(n){(t._status===0||t._status===-1)&&(t._status=1,t._result=n)},function(n){(t._status===0||t._status===-1)&&(t._status=2,t._result=n)}),t._status===-1&&(t._status=0,t._result=e)}if(t._status===1)return t._result.default;throw t._result}var At={current:null},El={transition:null},A_={ReactCurrentDispatcher:At,ReactCurrentBatchConfig:El,ReactCurrentOwner:Eh};function o0(){throw Error("act(...) is not supported in production builds of React.")}ae.Children={map:Qa,forEach:function(t,e,n){Qa(t,function(){e.apply(this,arguments)},n)},count:function(t){var e=0;return Qa(t,function(){e++}),e},toArray:function(t){return Qa(t,function(e){return e})||[]},only:function(t){if(!bh(t))throw Error("React.Children.only expected to receive a single React element child.");return t}};ae.Component=zs;ae.Fragment=m_;ae.Profiler=y_;ae.PureComponent=wh;ae.StrictMode=g_;ae.Suspense=x_;ae.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=A_;ae.act=o0;ae.cloneElement=function(t,e,n){if(t==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+t+".");var r=e0({},t.props),i=t.key,s=t.ref,o=t._owner;if(e!=null){if(e.ref!==void 0&&(s=e.ref,o=Eh.current),e.key!==void 0&&(i=""+e.key),t.type&&t.type.defaultProps)var l=t.type.defaultProps;for(u in e)r0.call(e,u)&&!i0.hasOwnProperty(u)&&(r[u]=e[u]===void 0&&l!==void 0?l[u]:e[u])}var u=arguments.length-2;if(u===1)r.children=n;else if(1<u){l=Array(u);for(var d=0;d<u;d++)l[d]=arguments[d+2];r.children=l}return{$$typeof:Ea,type:t.type,key:i,ref:s,props:r,_owner:o}};ae.createContext=function(t){return t={$$typeof:__,_currentValue:t,_currentValue2:t,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},t.Provider={$$typeof:v_,_context:t},t.Consumer=t};ae.createElement=s0;ae.createFactory=function(t){var e=s0.bind(null,t);return e.type=t,e};ae.createRef=function(){return{current:null}};ae.forwardRef=function(t){return{$$typeof:w_,render:t}};ae.isValidElement=bh;ae.lazy=function(t){return{$$typeof:b_,_payload:{_status:-1,_result:t},_init:I_}};ae.memo=function(t,e){return{$$typeof:E_,type:t,compare:e===void 0?null:e}};ae.startTransition=function(t){var e=El.transition;El.transition={};try{t()}finally{El.transition=e}};ae.unstable_act=o0;ae.useCallback=function(t,e){return At.current.useCallback(t,e)};ae.useContext=function(t){return At.current.useContext(t)};ae.useDebugValue=function(){};ae.useDeferredValue=function(t){return At.current.useDeferredValue(t)};ae.useEffect=function(t,e){return At.current.useEffect(t,e)};ae.useId=function(){return At.current.useId()};ae.useImperativeHandle=function(t,e,n){return At.current.useImperativeHandle(t,e,n)};ae.useInsertionEffect=function(t,e){return At.current.useInsertionEffect(t,e)};ae.useLayoutEffect=function(t,e){return At.current.useLayoutEffect(t,e)};ae.useMemo=function(t,e){return At.current.useMemo(t,e)};ae.useReducer=function(t,e,n){return At.current.useReducer(t,e,n)};ae.useRef=function(t){return At.current.useRef(t)};ae.useState=function(t){return At.current.useState(t)};ae.useSyncExternalStore=function(t,e,n){return At.current.useSyncExternalStore(t,e,n)};ae.useTransition=function(){return At.current.useTransition()};ae.version="18.3.1";Jg.exports=ae;var D=Jg.exports;const C_=f_(D);/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var R_=D,P_=Symbol.for("react.element"),N_=Symbol.for("react.fragment"),V_=Object.prototype.hasOwnProperty,D_=R_.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,M_={key:!0,ref:!0,__self:!0,__source:!0};function a0(t,e,n){var r,i={},s=null,o=null;n!==void 0&&(s=""+n),e.key!==void 0&&(s=""+e.key),e.ref!==void 0&&(o=e.ref);for(r in e)V_.call(e,r)&&!M_.hasOwnProperty(r)&&(i[r]=e[r]);if(t&&t.defaultProps)for(r in e=t.defaultProps,e)i[r]===void 0&&(i[r]=e[r]);return{$$typeof:P_,type:t,key:s,ref:o,props:i,_owner:D_.current}}Iu.Fragment=N_;Iu.jsx=a0;Iu.jsxs=a0;Xg.exports=Iu;var f=Xg.exports,Zc={},l0={exports:{}},$t={},u0={exports:{}},c0={};/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */(function(t){function e(H,Y){var te=H.length;H.push(Y);e:for(;0<te;){var we=te-1>>>1,oe=H[we];if(0<i(oe,Y))H[we]=Y,H[te]=oe,te=we;else break e}}function n(H){return H.length===0?null:H[0]}function r(H){if(H.length===0)return null;var Y=H[0],te=H.pop();if(te!==Y){H[0]=te;e:for(var we=0,oe=H.length,Tn=oe>>>1;we<Tn;){var ut=2*(we+1)-1,Ke=H[ut],Tt=ut+1,Ht=H[Tt];if(0>i(Ke,te))Tt<oe&&0>i(Ht,Ke)?(H[we]=Ht,H[Tt]=te,we=Tt):(H[we]=Ke,H[ut]=te,we=ut);else if(Tt<oe&&0>i(Ht,te))H[we]=Ht,H[Tt]=te,we=Tt;else break e}}return Y}function i(H,Y){var te=H.sortIndex-Y.sortIndex;return te!==0?te:H.id-Y.id}if(typeof performance=="object"&&typeof performance.now=="function"){var s=performance;t.unstable_now=function(){return s.now()}}else{var o=Date,l=o.now();t.unstable_now=function(){return o.now()-l}}var u=[],d=[],p=1,m=null,v=3,I=!1,A=!1,P=!1,M=typeof setTimeout=="function"?setTimeout:null,S=typeof clearTimeout=="function"?clearTimeout:null,x=typeof setImmediate<"u"?setImmediate:null;typeof navigator<"u"&&navigator.scheduling!==void 0&&navigator.scheduling.isInputPending!==void 0&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function k(H){for(var Y=n(d);Y!==null;){if(Y.callback===null)r(d);else if(Y.startTime<=H)r(d),Y.sortIndex=Y.expirationTime,e(u,Y);else break;Y=n(d)}}function V(H){if(P=!1,k(H),!A)if(n(u)!==null)A=!0,bt(F);else{var Y=n(d);Y!==null&&Le(V,Y.startTime-H)}}function F(H,Y){A=!1,P&&(P=!1,S(y),y=-1),I=!0;var te=v;try{for(k(Y),m=n(u);m!==null&&(!(m.expirationTime>Y)||H&&!T());){var we=m.callback;if(typeof we=="function"){m.callback=null,v=m.priorityLevel;var oe=we(m.expirationTime<=Y);Y=t.unstable_now(),typeof oe=="function"?m.callback=oe:m===n(u)&&r(u),k(Y)}else r(u);m=n(u)}if(m!==null)var Tn=!0;else{var ut=n(d);ut!==null&&Le(V,ut.startTime-Y),Tn=!1}return Tn}finally{m=null,v=te,I=!1}}var B=!1,w=null,y=-1,_=5,b=-1;function T(){return!(t.unstable_now()-b<_)}function C(){if(w!==null){var H=t.unstable_now();b=H;var Y=!0;try{Y=w(!0,H)}finally{Y?E():(B=!1,w=null)}}else B=!1}var E;if(typeof x=="function")E=function(){x(C)};else if(typeof MessageChannel<"u"){var J=new MessageChannel,Re=J.port2;J.port1.onmessage=C,E=function(){Re.postMessage(null)}}else E=function(){M(C,0)};function bt(H){w=H,B||(B=!0,E())}function Le(H,Y){y=M(function(){H(t.unstable_now())},Y)}t.unstable_IdlePriority=5,t.unstable_ImmediatePriority=1,t.unstable_LowPriority=4,t.unstable_NormalPriority=3,t.unstable_Profiling=null,t.unstable_UserBlockingPriority=2,t.unstable_cancelCallback=function(H){H.callback=null},t.unstable_continueExecution=function(){A||I||(A=!0,bt(F))},t.unstable_forceFrameRate=function(H){0>H||125<H?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):_=0<H?Math.floor(1e3/H):5},t.unstable_getCurrentPriorityLevel=function(){return v},t.unstable_getFirstCallbackNode=function(){return n(u)},t.unstable_next=function(H){switch(v){case 1:case 2:case 3:var Y=3;break;default:Y=v}var te=v;v=Y;try{return H()}finally{v=te}},t.unstable_pauseExecution=function(){},t.unstable_requestPaint=function(){},t.unstable_runWithPriority=function(H,Y){switch(H){case 1:case 2:case 3:case 4:case 5:break;default:H=3}var te=v;v=H;try{return Y()}finally{v=te}},t.unstable_scheduleCallback=function(H,Y,te){var we=t.unstable_now();switch(typeof te=="object"&&te!==null?(te=te.delay,te=typeof te=="number"&&0<te?we+te:we):te=we,H){case 1:var oe=-1;break;case 2:oe=250;break;case 5:oe=1073741823;break;case 4:oe=1e4;break;default:oe=5e3}return oe=te+oe,H={id:p++,callback:Y,priorityLevel:H,startTime:te,expirationTime:oe,sortIndex:-1},te>we?(H.sortIndex=te,e(d,H),n(u)===null&&H===n(d)&&(P?(S(y),y=-1):P=!0,Le(V,te-we))):(H.sortIndex=oe,e(u,H),A||I||(A=!0,bt(F))),H},t.unstable_shouldYield=T,t.unstable_wrapCallback=function(H){var Y=v;return function(){var te=v;v=Y;try{return H.apply(this,arguments)}finally{v=te}}}})(c0);u0.exports=c0;var L_=u0.exports;/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var j_=D,Bt=L_;function U(t){for(var e="https://reactjs.org/docs/error-decoder.html?invariant="+t,n=1;n<arguments.length;n++)e+="&args[]="+encodeURIComponent(arguments[n]);return"Minified React error #"+t+"; visit "+e+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var d0=new Set,Go={};function Mi(t,e){Is(t,e),Is(t+"Capture",e)}function Is(t,e){for(Go[t]=e,t=0;t<e.length;t++)d0.add(e[t])}var Xn=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),ed=Object.prototype.hasOwnProperty,O_=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,Ep={},bp={};function F_(t){return ed.call(bp,t)?!0:ed.call(Ep,t)?!1:O_.test(t)?bp[t]=!0:(Ep[t]=!0,!1)}function z_(t,e,n,r){if(n!==null&&n.type===0)return!1;switch(typeof e){case"function":case"symbol":return!0;case"boolean":return r?!1:n!==null?!n.acceptsBooleans:(t=t.toLowerCase().slice(0,5),t!=="data-"&&t!=="aria-");default:return!1}}function U_(t,e,n,r){if(e===null||typeof e>"u"||z_(t,e,n,r))return!0;if(r)return!1;if(n!==null)switch(n.type){case 3:return!e;case 4:return e===!1;case 5:return isNaN(e);case 6:return isNaN(e)||1>e}return!1}function Ct(t,e,n,r,i,s,o){this.acceptsBooleans=e===2||e===3||e===4,this.attributeName=r,this.attributeNamespace=i,this.mustUseProperty=n,this.propertyName=t,this.type=e,this.sanitizeURL=s,this.removeEmptyString=o}var pt={};"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(t){pt[t]=new Ct(t,0,!1,t,null,!1,!1)});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(t){var e=t[0];pt[e]=new Ct(e,1,!1,t[1],null,!1,!1)});["contentEditable","draggable","spellCheck","value"].forEach(function(t){pt[t]=new Ct(t,2,!1,t.toLowerCase(),null,!1,!1)});["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(t){pt[t]=new Ct(t,2,!1,t,null,!1,!1)});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(t){pt[t]=new Ct(t,3,!1,t.toLowerCase(),null,!1,!1)});["checked","multiple","muted","selected"].forEach(function(t){pt[t]=new Ct(t,3,!0,t,null,!1,!1)});["capture","download"].forEach(function(t){pt[t]=new Ct(t,4,!1,t,null,!1,!1)});["cols","rows","size","span"].forEach(function(t){pt[t]=new Ct(t,6,!1,t,null,!1,!1)});["rowSpan","start"].forEach(function(t){pt[t]=new Ct(t,5,!1,t.toLowerCase(),null,!1,!1)});var Th=/[\-:]([a-z])/g;function Sh(t){return t[1].toUpperCase()}"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(t){var e=t.replace(Th,Sh);pt[e]=new Ct(e,1,!1,t,null,!1,!1)});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(t){var e=t.replace(Th,Sh);pt[e]=new Ct(e,1,!1,t,"http://www.w3.org/1999/xlink",!1,!1)});["xml:base","xml:lang","xml:space"].forEach(function(t){var e=t.replace(Th,Sh);pt[e]=new Ct(e,1,!1,t,"http://www.w3.org/XML/1998/namespace",!1,!1)});["tabIndex","crossOrigin"].forEach(function(t){pt[t]=new Ct(t,1,!1,t.toLowerCase(),null,!1,!1)});pt.xlinkHref=new Ct("xlinkHref",1,!1,"xlink:href","http://www.w3.org/1999/xlink",!0,!1);["src","href","action","formAction"].forEach(function(t){pt[t]=new Ct(t,1,!1,t.toLowerCase(),null,!0,!0)});function kh(t,e,n,r){var i=pt.hasOwnProperty(e)?pt[e]:null;(i!==null?i.type!==0:r||!(2<e.length)||e[0]!=="o"&&e[0]!=="O"||e[1]!=="n"&&e[1]!=="N")&&(U_(e,n,i,r)&&(n=null),r||i===null?F_(e)&&(n===null?t.removeAttribute(e):t.setAttribute(e,""+n)):i.mustUseProperty?t[i.propertyName]=n===null?i.type===3?!1:"":n:(e=i.attributeName,r=i.attributeNamespace,n===null?t.removeAttribute(e):(i=i.type,n=i===3||i===4&&n===!0?"":""+n,r?t.setAttributeNS(r,e,n):t.setAttribute(e,n))))}var ir=j_.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,Ya=Symbol.for("react.element"),is=Symbol.for("react.portal"),ss=Symbol.for("react.fragment"),Ih=Symbol.for("react.strict_mode"),td=Symbol.for("react.profiler"),h0=Symbol.for("react.provider"),f0=Symbol.for("react.context"),Ah=Symbol.for("react.forward_ref"),nd=Symbol.for("react.suspense"),rd=Symbol.for("react.suspense_list"),Ch=Symbol.for("react.memo"),Er=Symbol.for("react.lazy"),p0=Symbol.for("react.offscreen"),Tp=Symbol.iterator;function po(t){return t===null||typeof t!="object"?null:(t=Tp&&t[Tp]||t["@@iterator"],typeof t=="function"?t:null)}var De=Object.assign,yc;function So(t){if(yc===void 0)try{throw Error()}catch(n){var e=n.stack.trim().match(/\n( *(at )?)/);yc=e&&e[1]||""}return`
`+yc+t}var vc=!1;function _c(t,e){if(!t||vc)return"";vc=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(e)if(e=function(){throw Error()},Object.defineProperty(e.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(e,[])}catch(d){var r=d}Reflect.construct(t,[],e)}else{try{e.call()}catch(d){r=d}t.call(e.prototype)}else{try{throw Error()}catch(d){r=d}t()}}catch(d){if(d&&r&&typeof d.stack=="string"){for(var i=d.stack.split(`
`),s=r.stack.split(`
`),o=i.length-1,l=s.length-1;1<=o&&0<=l&&i[o]!==s[l];)l--;for(;1<=o&&0<=l;o--,l--)if(i[o]!==s[l]){if(o!==1||l!==1)do if(o--,l--,0>l||i[o]!==s[l]){var u=`
`+i[o].replace(" at new "," at ");return t.displayName&&u.includes("<anonymous>")&&(u=u.replace("<anonymous>",t.displayName)),u}while(1<=o&&0<=l);break}}}finally{vc=!1,Error.prepareStackTrace=n}return(t=t?t.displayName||t.name:"")?So(t):""}function B_(t){switch(t.tag){case 5:return So(t.type);case 16:return So("Lazy");case 13:return So("Suspense");case 19:return So("SuspenseList");case 0:case 2:case 15:return t=_c(t.type,!1),t;case 11:return t=_c(t.type.render,!1),t;case 1:return t=_c(t.type,!0),t;default:return""}}function id(t){if(t==null)return null;if(typeof t=="function")return t.displayName||t.name||null;if(typeof t=="string")return t;switch(t){case ss:return"Fragment";case is:return"Portal";case td:return"Profiler";case Ih:return"StrictMode";case nd:return"Suspense";case rd:return"SuspenseList"}if(typeof t=="object")switch(t.$$typeof){case f0:return(t.displayName||"Context")+".Consumer";case h0:return(t._context.displayName||"Context")+".Provider";case Ah:var e=t.render;return t=t.displayName,t||(t=e.displayName||e.name||"",t=t!==""?"ForwardRef("+t+")":"ForwardRef"),t;case Ch:return e=t.displayName||null,e!==null?e:id(t.type)||"Memo";case Er:e=t._payload,t=t._init;try{return id(t(e))}catch{}}return null}function $_(t){var e=t.type;switch(t.tag){case 24:return"Cache";case 9:return(e.displayName||"Context")+".Consumer";case 10:return(e._context.displayName||"Context")+".Provider";case 18:return"DehydratedFragment";case 11:return t=e.render,t=t.displayName||t.name||"",e.displayName||(t!==""?"ForwardRef("+t+")":"ForwardRef");case 7:return"Fragment";case 5:return e;case 4:return"Portal";case 3:return"Root";case 6:return"Text";case 16:return id(e);case 8:return e===Ih?"StrictMode":"Mode";case 22:return"Offscreen";case 12:return"Profiler";case 21:return"Scope";case 13:return"Suspense";case 19:return"SuspenseList";case 25:return"TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if(typeof e=="function")return e.displayName||e.name||null;if(typeof e=="string")return e}return null}function Br(t){switch(typeof t){case"boolean":case"number":case"string":case"undefined":return t;case"object":return t;default:return""}}function m0(t){var e=t.type;return(t=t.nodeName)&&t.toLowerCase()==="input"&&(e==="checkbox"||e==="radio")}function q_(t){var e=m0(t)?"checked":"value",n=Object.getOwnPropertyDescriptor(t.constructor.prototype,e),r=""+t[e];if(!t.hasOwnProperty(e)&&typeof n<"u"&&typeof n.get=="function"&&typeof n.set=="function"){var i=n.get,s=n.set;return Object.defineProperty(t,e,{configurable:!0,get:function(){return i.call(this)},set:function(o){r=""+o,s.call(this,o)}}),Object.defineProperty(t,e,{enumerable:n.enumerable}),{getValue:function(){return r},setValue:function(o){r=""+o},stopTracking:function(){t._valueTracker=null,delete t[e]}}}}function Xa(t){t._valueTracker||(t._valueTracker=q_(t))}function g0(t){if(!t)return!1;var e=t._valueTracker;if(!e)return!0;var n=e.getValue(),r="";return t&&(r=m0(t)?t.checked?"true":"false":t.value),t=r,t!==n?(e.setValue(t),!0):!1}function Fl(t){if(t=t||(typeof document<"u"?document:void 0),typeof t>"u")return null;try{return t.activeElement||t.body}catch{return t.body}}function sd(t,e){var n=e.checked;return De({},e,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:n??t._wrapperState.initialChecked})}function Sp(t,e){var n=e.defaultValue==null?"":e.defaultValue,r=e.checked!=null?e.checked:e.defaultChecked;n=Br(e.value!=null?e.value:n),t._wrapperState={initialChecked:r,initialValue:n,controlled:e.type==="checkbox"||e.type==="radio"?e.checked!=null:e.value!=null}}function y0(t,e){e=e.checked,e!=null&&kh(t,"checked",e,!1)}function od(t,e){y0(t,e);var n=Br(e.value),r=e.type;if(n!=null)r==="number"?(n===0&&t.value===""||t.value!=n)&&(t.value=""+n):t.value!==""+n&&(t.value=""+n);else if(r==="submit"||r==="reset"){t.removeAttribute("value");return}e.hasOwnProperty("value")?ad(t,e.type,n):e.hasOwnProperty("defaultValue")&&ad(t,e.type,Br(e.defaultValue)),e.checked==null&&e.defaultChecked!=null&&(t.defaultChecked=!!e.defaultChecked)}function kp(t,e,n){if(e.hasOwnProperty("value")||e.hasOwnProperty("defaultValue")){var r=e.type;if(!(r!=="submit"&&r!=="reset"||e.value!==void 0&&e.value!==null))return;e=""+t._wrapperState.initialValue,n||e===t.value||(t.value=e),t.defaultValue=e}n=t.name,n!==""&&(t.name=""),t.defaultChecked=!!t._wrapperState.initialChecked,n!==""&&(t.name=n)}function ad(t,e,n){(e!=="number"||Fl(t.ownerDocument)!==t)&&(n==null?t.defaultValue=""+t._wrapperState.initialValue:t.defaultValue!==""+n&&(t.defaultValue=""+n))}var ko=Array.isArray;function gs(t,e,n,r){if(t=t.options,e){e={};for(var i=0;i<n.length;i++)e["$"+n[i]]=!0;for(n=0;n<t.length;n++)i=e.hasOwnProperty("$"+t[n].value),t[n].selected!==i&&(t[n].selected=i),i&&r&&(t[n].defaultSelected=!0)}else{for(n=""+Br(n),e=null,i=0;i<t.length;i++){if(t[i].value===n){t[i].selected=!0,r&&(t[i].defaultSelected=!0);return}e!==null||t[i].disabled||(e=t[i])}e!==null&&(e.selected=!0)}}function ld(t,e){if(e.dangerouslySetInnerHTML!=null)throw Error(U(91));return De({},e,{value:void 0,defaultValue:void 0,children:""+t._wrapperState.initialValue})}function Ip(t,e){var n=e.value;if(n==null){if(n=e.children,e=e.defaultValue,n!=null){if(e!=null)throw Error(U(92));if(ko(n)){if(1<n.length)throw Error(U(93));n=n[0]}e=n}e==null&&(e=""),n=e}t._wrapperState={initialValue:Br(n)}}function v0(t,e){var n=Br(e.value),r=Br(e.defaultValue);n!=null&&(n=""+n,n!==t.value&&(t.value=n),e.defaultValue==null&&t.defaultValue!==n&&(t.defaultValue=n)),r!=null&&(t.defaultValue=""+r)}function Ap(t){var e=t.textContent;e===t._wrapperState.initialValue&&e!==""&&e!==null&&(t.value=e)}function _0(t){switch(t){case"svg":return"http://www.w3.org/2000/svg";case"math":return"http://www.w3.org/1998/Math/MathML";default:return"http://www.w3.org/1999/xhtml"}}function ud(t,e){return t==null||t==="http://www.w3.org/1999/xhtml"?_0(e):t==="http://www.w3.org/2000/svg"&&e==="foreignObject"?"http://www.w3.org/1999/xhtml":t}var Ja,w0=function(t){return typeof MSApp<"u"&&MSApp.execUnsafeLocalFunction?function(e,n,r,i){MSApp.execUnsafeLocalFunction(function(){return t(e,n,r,i)})}:t}(function(t,e){if(t.namespaceURI!=="http://www.w3.org/2000/svg"||"innerHTML"in t)t.innerHTML=e;else{for(Ja=Ja||document.createElement("div"),Ja.innerHTML="<svg>"+e.valueOf().toString()+"</svg>",e=Ja.firstChild;t.firstChild;)t.removeChild(t.firstChild);for(;e.firstChild;)t.appendChild(e.firstChild)}});function Ko(t,e){if(e){var n=t.firstChild;if(n&&n===t.lastChild&&n.nodeType===3){n.nodeValue=e;return}}t.textContent=e}var Vo={animationIterationCount:!0,aspectRatio:!0,borderImageOutset:!0,borderImageSlice:!0,borderImageWidth:!0,boxFlex:!0,boxFlexGroup:!0,boxOrdinalGroup:!0,columnCount:!0,columns:!0,flex:!0,flexGrow:!0,flexPositive:!0,flexShrink:!0,flexNegative:!0,flexOrder:!0,gridArea:!0,gridRow:!0,gridRowEnd:!0,gridRowSpan:!0,gridRowStart:!0,gridColumn:!0,gridColumnEnd:!0,gridColumnSpan:!0,gridColumnStart:!0,fontWeight:!0,lineClamp:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,tabSize:!0,widows:!0,zIndex:!0,zoom:!0,fillOpacity:!0,floodOpacity:!0,stopOpacity:!0,strokeDasharray:!0,strokeDashoffset:!0,strokeMiterlimit:!0,strokeOpacity:!0,strokeWidth:!0},H_=["Webkit","ms","Moz","O"];Object.keys(Vo).forEach(function(t){H_.forEach(function(e){e=e+t.charAt(0).toUpperCase()+t.substring(1),Vo[e]=Vo[t]})});function x0(t,e,n){return e==null||typeof e=="boolean"||e===""?"":n||typeof e!="number"||e===0||Vo.hasOwnProperty(t)&&Vo[t]?(""+e).trim():e+"px"}function E0(t,e){t=t.style;for(var n in e)if(e.hasOwnProperty(n)){var r=n.indexOf("--")===0,i=x0(n,e[n],r);n==="float"&&(n="cssFloat"),r?t.setProperty(n,i):t[n]=i}}var W_=De({menuitem:!0},{area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0});function cd(t,e){if(e){if(W_[t]&&(e.children!=null||e.dangerouslySetInnerHTML!=null))throw Error(U(137,t));if(e.dangerouslySetInnerHTML!=null){if(e.children!=null)throw Error(U(60));if(typeof e.dangerouslySetInnerHTML!="object"||!("__html"in e.dangerouslySetInnerHTML))throw Error(U(61))}if(e.style!=null&&typeof e.style!="object")throw Error(U(62))}}function dd(t,e){if(t.indexOf("-")===-1)return typeof e.is=="string";switch(t){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var hd=null;function Rh(t){return t=t.target||t.srcElement||window,t.correspondingUseElement&&(t=t.correspondingUseElement),t.nodeType===3?t.parentNode:t}var fd=null,ys=null,vs=null;function Cp(t){if(t=Sa(t)){if(typeof fd!="function")throw Error(U(280));var e=t.stateNode;e&&(e=Nu(e),fd(t.stateNode,t.type,e))}}function b0(t){ys?vs?vs.push(t):vs=[t]:ys=t}function T0(){if(ys){var t=ys,e=vs;if(vs=ys=null,Cp(t),e)for(t=0;t<e.length;t++)Cp(e[t])}}function S0(t,e){return t(e)}function k0(){}var wc=!1;function I0(t,e,n){if(wc)return t(e,n);wc=!0;try{return S0(t,e,n)}finally{wc=!1,(ys!==null||vs!==null)&&(k0(),T0())}}function Qo(t,e){var n=t.stateNode;if(n===null)return null;var r=Nu(n);if(r===null)return null;n=r[e];e:switch(e){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(r=!r.disabled)||(t=t.type,r=!(t==="button"||t==="input"||t==="select"||t==="textarea")),t=!r;break e;default:t=!1}if(t)return null;if(n&&typeof n!="function")throw Error(U(231,e,typeof n));return n}var pd=!1;if(Xn)try{var mo={};Object.defineProperty(mo,"passive",{get:function(){pd=!0}}),window.addEventListener("test",mo,mo),window.removeEventListener("test",mo,mo)}catch{pd=!1}function G_(t,e,n,r,i,s,o,l,u){var d=Array.prototype.slice.call(arguments,3);try{e.apply(n,d)}catch(p){this.onError(p)}}var Do=!1,zl=null,Ul=!1,md=null,K_={onError:function(t){Do=!0,zl=t}};function Q_(t,e,n,r,i,s,o,l,u){Do=!1,zl=null,G_.apply(K_,arguments)}function Y_(t,e,n,r,i,s,o,l,u){if(Q_.apply(this,arguments),Do){if(Do){var d=zl;Do=!1,zl=null}else throw Error(U(198));Ul||(Ul=!0,md=d)}}function Li(t){var e=t,n=t;if(t.alternate)for(;e.return;)e=e.return;else{t=e;do e=t,e.flags&4098&&(n=e.return),t=e.return;while(t)}return e.tag===3?n:null}function A0(t){if(t.tag===13){var e=t.memoizedState;if(e===null&&(t=t.alternate,t!==null&&(e=t.memoizedState)),e!==null)return e.dehydrated}return null}function Rp(t){if(Li(t)!==t)throw Error(U(188))}function X_(t){var e=t.alternate;if(!e){if(e=Li(t),e===null)throw Error(U(188));return e!==t?null:t}for(var n=t,r=e;;){var i=n.return;if(i===null)break;var s=i.alternate;if(s===null){if(r=i.return,r!==null){n=r;continue}break}if(i.child===s.child){for(s=i.child;s;){if(s===n)return Rp(i),t;if(s===r)return Rp(i),e;s=s.sibling}throw Error(U(188))}if(n.return!==r.return)n=i,r=s;else{for(var o=!1,l=i.child;l;){if(l===n){o=!0,n=i,r=s;break}if(l===r){o=!0,r=i,n=s;break}l=l.sibling}if(!o){for(l=s.child;l;){if(l===n){o=!0,n=s,r=i;break}if(l===r){o=!0,r=s,n=i;break}l=l.sibling}if(!o)throw Error(U(189))}}if(n.alternate!==r)throw Error(U(190))}if(n.tag!==3)throw Error(U(188));return n.stateNode.current===n?t:e}function C0(t){return t=X_(t),t!==null?R0(t):null}function R0(t){if(t.tag===5||t.tag===6)return t;for(t=t.child;t!==null;){var e=R0(t);if(e!==null)return e;t=t.sibling}return null}var P0=Bt.unstable_scheduleCallback,Pp=Bt.unstable_cancelCallback,J_=Bt.unstable_shouldYield,Z_=Bt.unstable_requestPaint,Be=Bt.unstable_now,ew=Bt.unstable_getCurrentPriorityLevel,Ph=Bt.unstable_ImmediatePriority,N0=Bt.unstable_UserBlockingPriority,Bl=Bt.unstable_NormalPriority,tw=Bt.unstable_LowPriority,V0=Bt.unstable_IdlePriority,Au=null,Mn=null;function nw(t){if(Mn&&typeof Mn.onCommitFiberRoot=="function")try{Mn.onCommitFiberRoot(Au,t,void 0,(t.current.flags&128)===128)}catch{}}var _n=Math.clz32?Math.clz32:sw,rw=Math.log,iw=Math.LN2;function sw(t){return t>>>=0,t===0?32:31-(rw(t)/iw|0)|0}var Za=64,el=4194304;function Io(t){switch(t&-t){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return t&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;default:return t}}function $l(t,e){var n=t.pendingLanes;if(n===0)return 0;var r=0,i=t.suspendedLanes,s=t.pingedLanes,o=n&268435455;if(o!==0){var l=o&~i;l!==0?r=Io(l):(s&=o,s!==0&&(r=Io(s)))}else o=n&~i,o!==0?r=Io(o):s!==0&&(r=Io(s));if(r===0)return 0;if(e!==0&&e!==r&&!(e&i)&&(i=r&-r,s=e&-e,i>=s||i===16&&(s&4194240)!==0))return e;if(r&4&&(r|=n&16),e=t.entangledLanes,e!==0)for(t=t.entanglements,e&=r;0<e;)n=31-_n(e),i=1<<n,r|=t[n],e&=~i;return r}function ow(t,e){switch(t){case 1:case 2:case 4:return e+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return e+5e3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return-1;case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function aw(t,e){for(var n=t.suspendedLanes,r=t.pingedLanes,i=t.expirationTimes,s=t.pendingLanes;0<s;){var o=31-_n(s),l=1<<o,u=i[o];u===-1?(!(l&n)||l&r)&&(i[o]=ow(l,e)):u<=e&&(t.expiredLanes|=l),s&=~l}}function gd(t){return t=t.pendingLanes&-1073741825,t!==0?t:t&1073741824?1073741824:0}function D0(){var t=Za;return Za<<=1,!(Za&4194240)&&(Za=64),t}function xc(t){for(var e=[],n=0;31>n;n++)e.push(t);return e}function ba(t,e,n){t.pendingLanes|=e,e!==536870912&&(t.suspendedLanes=0,t.pingedLanes=0),t=t.eventTimes,e=31-_n(e),t[e]=n}function lw(t,e){var n=t.pendingLanes&~e;t.pendingLanes=e,t.suspendedLanes=0,t.pingedLanes=0,t.expiredLanes&=e,t.mutableReadLanes&=e,t.entangledLanes&=e,e=t.entanglements;var r=t.eventTimes;for(t=t.expirationTimes;0<n;){var i=31-_n(n),s=1<<i;e[i]=0,r[i]=-1,t[i]=-1,n&=~s}}function Nh(t,e){var n=t.entangledLanes|=e;for(t=t.entanglements;n;){var r=31-_n(n),i=1<<r;i&e|t[r]&e&&(t[r]|=e),n&=~i}}var _e=0;function M0(t){return t&=-t,1<t?4<t?t&268435455?16:536870912:4:1}var L0,Vh,j0,O0,F0,yd=!1,tl=[],Cr=null,Rr=null,Pr=null,Yo=new Map,Xo=new Map,Tr=[],uw="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");function Np(t,e){switch(t){case"focusin":case"focusout":Cr=null;break;case"dragenter":case"dragleave":Rr=null;break;case"mouseover":case"mouseout":Pr=null;break;case"pointerover":case"pointerout":Yo.delete(e.pointerId);break;case"gotpointercapture":case"lostpointercapture":Xo.delete(e.pointerId)}}function go(t,e,n,r,i,s){return t===null||t.nativeEvent!==s?(t={blockedOn:e,domEventName:n,eventSystemFlags:r,nativeEvent:s,targetContainers:[i]},e!==null&&(e=Sa(e),e!==null&&Vh(e)),t):(t.eventSystemFlags|=r,e=t.targetContainers,i!==null&&e.indexOf(i)===-1&&e.push(i),t)}function cw(t,e,n,r,i){switch(e){case"focusin":return Cr=go(Cr,t,e,n,r,i),!0;case"dragenter":return Rr=go(Rr,t,e,n,r,i),!0;case"mouseover":return Pr=go(Pr,t,e,n,r,i),!0;case"pointerover":var s=i.pointerId;return Yo.set(s,go(Yo.get(s)||null,t,e,n,r,i)),!0;case"gotpointercapture":return s=i.pointerId,Xo.set(s,go(Xo.get(s)||null,t,e,n,r,i)),!0}return!1}function z0(t){var e=wi(t.target);if(e!==null){var n=Li(e);if(n!==null){if(e=n.tag,e===13){if(e=A0(n),e!==null){t.blockedOn=e,F0(t.priority,function(){j0(n)});return}}else if(e===3&&n.stateNode.current.memoizedState.isDehydrated){t.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}t.blockedOn=null}function bl(t){if(t.blockedOn!==null)return!1;for(var e=t.targetContainers;0<e.length;){var n=vd(t.domEventName,t.eventSystemFlags,e[0],t.nativeEvent);if(n===null){n=t.nativeEvent;var r=new n.constructor(n.type,n);hd=r,n.target.dispatchEvent(r),hd=null}else return e=Sa(n),e!==null&&Vh(e),t.blockedOn=n,!1;e.shift()}return!0}function Vp(t,e,n){bl(t)&&n.delete(e)}function dw(){yd=!1,Cr!==null&&bl(Cr)&&(Cr=null),Rr!==null&&bl(Rr)&&(Rr=null),Pr!==null&&bl(Pr)&&(Pr=null),Yo.forEach(Vp),Xo.forEach(Vp)}function yo(t,e){t.blockedOn===e&&(t.blockedOn=null,yd||(yd=!0,Bt.unstable_scheduleCallback(Bt.unstable_NormalPriority,dw)))}function Jo(t){function e(i){return yo(i,t)}if(0<tl.length){yo(tl[0],t);for(var n=1;n<tl.length;n++){var r=tl[n];r.blockedOn===t&&(r.blockedOn=null)}}for(Cr!==null&&yo(Cr,t),Rr!==null&&yo(Rr,t),Pr!==null&&yo(Pr,t),Yo.forEach(e),Xo.forEach(e),n=0;n<Tr.length;n++)r=Tr[n],r.blockedOn===t&&(r.blockedOn=null);for(;0<Tr.length&&(n=Tr[0],n.blockedOn===null);)z0(n),n.blockedOn===null&&Tr.shift()}var _s=ir.ReactCurrentBatchConfig,ql=!0;function hw(t,e,n,r){var i=_e,s=_s.transition;_s.transition=null;try{_e=1,Dh(t,e,n,r)}finally{_e=i,_s.transition=s}}function fw(t,e,n,r){var i=_e,s=_s.transition;_s.transition=null;try{_e=4,Dh(t,e,n,r)}finally{_e=i,_s.transition=s}}function Dh(t,e,n,r){if(ql){var i=vd(t,e,n,r);if(i===null)Pc(t,e,r,Hl,n),Np(t,r);else if(cw(i,t,e,n,r))r.stopPropagation();else if(Np(t,r),e&4&&-1<uw.indexOf(t)){for(;i!==null;){var s=Sa(i);if(s!==null&&L0(s),s=vd(t,e,n,r),s===null&&Pc(t,e,r,Hl,n),s===i)break;i=s}i!==null&&r.stopPropagation()}else Pc(t,e,r,null,n)}}var Hl=null;function vd(t,e,n,r){if(Hl=null,t=Rh(r),t=wi(t),t!==null)if(e=Li(t),e===null)t=null;else if(n=e.tag,n===13){if(t=A0(e),t!==null)return t;t=null}else if(n===3){if(e.stateNode.current.memoizedState.isDehydrated)return e.tag===3?e.stateNode.containerInfo:null;t=null}else e!==t&&(t=null);return Hl=t,null}function U0(t){switch(t){case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"resize":case"seeked":case"submit":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 1;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"scroll":case"toggle":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 4;case"message":switch(ew()){case Ph:return 1;case N0:return 4;case Bl:case tw:return 16;case V0:return 536870912;default:return 16}default:return 16}}var kr=null,Mh=null,Tl=null;function B0(){if(Tl)return Tl;var t,e=Mh,n=e.length,r,i="value"in kr?kr.value:kr.textContent,s=i.length;for(t=0;t<n&&e[t]===i[t];t++);var o=n-t;for(r=1;r<=o&&e[n-r]===i[s-r];r++);return Tl=i.slice(t,1<r?1-r:void 0)}function Sl(t){var e=t.keyCode;return"charCode"in t?(t=t.charCode,t===0&&e===13&&(t=13)):t=e,t===10&&(t=13),32<=t||t===13?t:0}function nl(){return!0}function Dp(){return!1}function qt(t){function e(n,r,i,s,o){this._reactName=n,this._targetInst=i,this.type=r,this.nativeEvent=s,this.target=o,this.currentTarget=null;for(var l in t)t.hasOwnProperty(l)&&(n=t[l],this[l]=n?n(s):s[l]);return this.isDefaultPrevented=(s.defaultPrevented!=null?s.defaultPrevented:s.returnValue===!1)?nl:Dp,this.isPropagationStopped=Dp,this}return De(e.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=nl)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=nl)},persist:function(){},isPersistent:nl}),e}var Us={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(t){return t.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Lh=qt(Us),Ta=De({},Us,{view:0,detail:0}),pw=qt(Ta),Ec,bc,vo,Cu=De({},Ta,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:jh,button:0,buttons:0,relatedTarget:function(t){return t.relatedTarget===void 0?t.fromElement===t.srcElement?t.toElement:t.fromElement:t.relatedTarget},movementX:function(t){return"movementX"in t?t.movementX:(t!==vo&&(vo&&t.type==="mousemove"?(Ec=t.screenX-vo.screenX,bc=t.screenY-vo.screenY):bc=Ec=0,vo=t),Ec)},movementY:function(t){return"movementY"in t?t.movementY:bc}}),Mp=qt(Cu),mw=De({},Cu,{dataTransfer:0}),gw=qt(mw),yw=De({},Ta,{relatedTarget:0}),Tc=qt(yw),vw=De({},Us,{animationName:0,elapsedTime:0,pseudoElement:0}),_w=qt(vw),ww=De({},Us,{clipboardData:function(t){return"clipboardData"in t?t.clipboardData:window.clipboardData}}),xw=qt(ww),Ew=De({},Us,{data:0}),Lp=qt(Ew),bw={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Tw={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Sw={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function kw(t){var e=this.nativeEvent;return e.getModifierState?e.getModifierState(t):(t=Sw[t])?!!e[t]:!1}function jh(){return kw}var Iw=De({},Ta,{key:function(t){if(t.key){var e=bw[t.key]||t.key;if(e!=="Unidentified")return e}return t.type==="keypress"?(t=Sl(t),t===13?"Enter":String.fromCharCode(t)):t.type==="keydown"||t.type==="keyup"?Tw[t.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:jh,charCode:function(t){return t.type==="keypress"?Sl(t):0},keyCode:function(t){return t.type==="keydown"||t.type==="keyup"?t.keyCode:0},which:function(t){return t.type==="keypress"?Sl(t):t.type==="keydown"||t.type==="keyup"?t.keyCode:0}}),Aw=qt(Iw),Cw=De({},Cu,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),jp=qt(Cw),Rw=De({},Ta,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:jh}),Pw=qt(Rw),Nw=De({},Us,{propertyName:0,elapsedTime:0,pseudoElement:0}),Vw=qt(Nw),Dw=De({},Cu,{deltaX:function(t){return"deltaX"in t?t.deltaX:"wheelDeltaX"in t?-t.wheelDeltaX:0},deltaY:function(t){return"deltaY"in t?t.deltaY:"wheelDeltaY"in t?-t.wheelDeltaY:"wheelDelta"in t?-t.wheelDelta:0},deltaZ:0,deltaMode:0}),Mw=qt(Dw),Lw=[9,13,27,32],Oh=Xn&&"CompositionEvent"in window,Mo=null;Xn&&"documentMode"in document&&(Mo=document.documentMode);var jw=Xn&&"TextEvent"in window&&!Mo,$0=Xn&&(!Oh||Mo&&8<Mo&&11>=Mo),Op=" ",Fp=!1;function q0(t,e){switch(t){case"keyup":return Lw.indexOf(e.keyCode)!==-1;case"keydown":return e.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function H0(t){return t=t.detail,typeof t=="object"&&"data"in t?t.data:null}var os=!1;function Ow(t,e){switch(t){case"compositionend":return H0(e);case"keypress":return e.which!==32?null:(Fp=!0,Op);case"textInput":return t=e.data,t===Op&&Fp?null:t;default:return null}}function Fw(t,e){if(os)return t==="compositionend"||!Oh&&q0(t,e)?(t=B0(),Tl=Mh=kr=null,os=!1,t):null;switch(t){case"paste":return null;case"keypress":if(!(e.ctrlKey||e.altKey||e.metaKey)||e.ctrlKey&&e.altKey){if(e.char&&1<e.char.length)return e.char;if(e.which)return String.fromCharCode(e.which)}return null;case"compositionend":return $0&&e.locale!=="ko"?null:e.data;default:return null}}var zw={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function zp(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e==="input"?!!zw[t.type]:e==="textarea"}function W0(t,e,n,r){b0(r),e=Wl(e,"onChange"),0<e.length&&(n=new Lh("onChange","change",null,n,r),t.push({event:n,listeners:e}))}var Lo=null,Zo=null;function Uw(t){ry(t,0)}function Ru(t){var e=us(t);if(g0(e))return t}function Bw(t,e){if(t==="change")return e}var G0=!1;if(Xn){var Sc;if(Xn){var kc="oninput"in document;if(!kc){var Up=document.createElement("div");Up.setAttribute("oninput","return;"),kc=typeof Up.oninput=="function"}Sc=kc}else Sc=!1;G0=Sc&&(!document.documentMode||9<document.documentMode)}function Bp(){Lo&&(Lo.detachEvent("onpropertychange",K0),Zo=Lo=null)}function K0(t){if(t.propertyName==="value"&&Ru(Zo)){var e=[];W0(e,Zo,t,Rh(t)),I0(Uw,e)}}function $w(t,e,n){t==="focusin"?(Bp(),Lo=e,Zo=n,Lo.attachEvent("onpropertychange",K0)):t==="focusout"&&Bp()}function qw(t){if(t==="selectionchange"||t==="keyup"||t==="keydown")return Ru(Zo)}function Hw(t,e){if(t==="click")return Ru(e)}function Ww(t,e){if(t==="input"||t==="change")return Ru(e)}function Gw(t,e){return t===e&&(t!==0||1/t===1/e)||t!==t&&e!==e}var En=typeof Object.is=="function"?Object.is:Gw;function ea(t,e){if(En(t,e))return!0;if(typeof t!="object"||t===null||typeof e!="object"||e===null)return!1;var n=Object.keys(t),r=Object.keys(e);if(n.length!==r.length)return!1;for(r=0;r<n.length;r++){var i=n[r];if(!ed.call(e,i)||!En(t[i],e[i]))return!1}return!0}function $p(t){for(;t&&t.firstChild;)t=t.firstChild;return t}function qp(t,e){var n=$p(t);t=0;for(var r;n;){if(n.nodeType===3){if(r=t+n.textContent.length,t<=e&&r>=e)return{node:n,offset:e-t};t=r}e:{for(;n;){if(n.nextSibling){n=n.nextSibling;break e}n=n.parentNode}n=void 0}n=$p(n)}}function Q0(t,e){return t&&e?t===e?!0:t&&t.nodeType===3?!1:e&&e.nodeType===3?Q0(t,e.parentNode):"contains"in t?t.contains(e):t.compareDocumentPosition?!!(t.compareDocumentPosition(e)&16):!1:!1}function Y0(){for(var t=window,e=Fl();e instanceof t.HTMLIFrameElement;){try{var n=typeof e.contentWindow.location.href=="string"}catch{n=!1}if(n)t=e.contentWindow;else break;e=Fl(t.document)}return e}function Fh(t){var e=t&&t.nodeName&&t.nodeName.toLowerCase();return e&&(e==="input"&&(t.type==="text"||t.type==="search"||t.type==="tel"||t.type==="url"||t.type==="password")||e==="textarea"||t.contentEditable==="true")}function Kw(t){var e=Y0(),n=t.focusedElem,r=t.selectionRange;if(e!==n&&n&&n.ownerDocument&&Q0(n.ownerDocument.documentElement,n)){if(r!==null&&Fh(n)){if(e=r.start,t=r.end,t===void 0&&(t=e),"selectionStart"in n)n.selectionStart=e,n.selectionEnd=Math.min(t,n.value.length);else if(t=(e=n.ownerDocument||document)&&e.defaultView||window,t.getSelection){t=t.getSelection();var i=n.textContent.length,s=Math.min(r.start,i);r=r.end===void 0?s:Math.min(r.end,i),!t.extend&&s>r&&(i=r,r=s,s=i),i=qp(n,s);var o=qp(n,r);i&&o&&(t.rangeCount!==1||t.anchorNode!==i.node||t.anchorOffset!==i.offset||t.focusNode!==o.node||t.focusOffset!==o.offset)&&(e=e.createRange(),e.setStart(i.node,i.offset),t.removeAllRanges(),s>r?(t.addRange(e),t.extend(o.node,o.offset)):(e.setEnd(o.node,o.offset),t.addRange(e)))}}for(e=[],t=n;t=t.parentNode;)t.nodeType===1&&e.push({element:t,left:t.scrollLeft,top:t.scrollTop});for(typeof n.focus=="function"&&n.focus(),n=0;n<e.length;n++)t=e[n],t.element.scrollLeft=t.left,t.element.scrollTop=t.top}}var Qw=Xn&&"documentMode"in document&&11>=document.documentMode,as=null,_d=null,jo=null,wd=!1;function Hp(t,e,n){var r=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;wd||as==null||as!==Fl(r)||(r=as,"selectionStart"in r&&Fh(r)?r={start:r.selectionStart,end:r.selectionEnd}:(r=(r.ownerDocument&&r.ownerDocument.defaultView||window).getSelection(),r={anchorNode:r.anchorNode,anchorOffset:r.anchorOffset,focusNode:r.focusNode,focusOffset:r.focusOffset}),jo&&ea(jo,r)||(jo=r,r=Wl(_d,"onSelect"),0<r.length&&(e=new Lh("onSelect","select",null,e,n),t.push({event:e,listeners:r}),e.target=as)))}function rl(t,e){var n={};return n[t.toLowerCase()]=e.toLowerCase(),n["Webkit"+t]="webkit"+e,n["Moz"+t]="moz"+e,n}var ls={animationend:rl("Animation","AnimationEnd"),animationiteration:rl("Animation","AnimationIteration"),animationstart:rl("Animation","AnimationStart"),transitionend:rl("Transition","TransitionEnd")},Ic={},X0={};Xn&&(X0=document.createElement("div").style,"AnimationEvent"in window||(delete ls.animationend.animation,delete ls.animationiteration.animation,delete ls.animationstart.animation),"TransitionEvent"in window||delete ls.transitionend.transition);function Pu(t){if(Ic[t])return Ic[t];if(!ls[t])return t;var e=ls[t],n;for(n in e)if(e.hasOwnProperty(n)&&n in X0)return Ic[t]=e[n];return t}var J0=Pu("animationend"),Z0=Pu("animationiteration"),ey=Pu("animationstart"),ty=Pu("transitionend"),ny=new Map,Wp="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");function Yr(t,e){ny.set(t,e),Mi(e,[t])}for(var Ac=0;Ac<Wp.length;Ac++){var Cc=Wp[Ac],Yw=Cc.toLowerCase(),Xw=Cc[0].toUpperCase()+Cc.slice(1);Yr(Yw,"on"+Xw)}Yr(J0,"onAnimationEnd");Yr(Z0,"onAnimationIteration");Yr(ey,"onAnimationStart");Yr("dblclick","onDoubleClick");Yr("focusin","onFocus");Yr("focusout","onBlur");Yr(ty,"onTransitionEnd");Is("onMouseEnter",["mouseout","mouseover"]);Is("onMouseLeave",["mouseout","mouseover"]);Is("onPointerEnter",["pointerout","pointerover"]);Is("onPointerLeave",["pointerout","pointerover"]);Mi("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));Mi("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));Mi("onBeforeInput",["compositionend","keypress","textInput","paste"]);Mi("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));Mi("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));Mi("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Ao="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),Jw=new Set("cancel close invalid load scroll toggle".split(" ").concat(Ao));function Gp(t,e,n){var r=t.type||"unknown-event";t.currentTarget=n,Y_(r,e,void 0,t),t.currentTarget=null}function ry(t,e){e=(e&4)!==0;for(var n=0;n<t.length;n++){var r=t[n],i=r.event;r=r.listeners;e:{var s=void 0;if(e)for(var o=r.length-1;0<=o;o--){var l=r[o],u=l.instance,d=l.currentTarget;if(l=l.listener,u!==s&&i.isPropagationStopped())break e;Gp(i,l,d),s=u}else for(o=0;o<r.length;o++){if(l=r[o],u=l.instance,d=l.currentTarget,l=l.listener,u!==s&&i.isPropagationStopped())break e;Gp(i,l,d),s=u}}}if(Ul)throw t=md,Ul=!1,md=null,t}function Se(t,e){var n=e[Sd];n===void 0&&(n=e[Sd]=new Set);var r=t+"__bubble";n.has(r)||(iy(e,t,2,!1),n.add(r))}function Rc(t,e,n){var r=0;e&&(r|=4),iy(n,t,r,e)}var il="_reactListening"+Math.random().toString(36).slice(2);function ta(t){if(!t[il]){t[il]=!0,d0.forEach(function(n){n!=="selectionchange"&&(Jw.has(n)||Rc(n,!1,t),Rc(n,!0,t))});var e=t.nodeType===9?t:t.ownerDocument;e===null||e[il]||(e[il]=!0,Rc("selectionchange",!1,e))}}function iy(t,e,n,r){switch(U0(e)){case 1:var i=hw;break;case 4:i=fw;break;default:i=Dh}n=i.bind(null,e,n,t),i=void 0,!pd||e!=="touchstart"&&e!=="touchmove"&&e!=="wheel"||(i=!0),r?i!==void 0?t.addEventListener(e,n,{capture:!0,passive:i}):t.addEventListener(e,n,!0):i!==void 0?t.addEventListener(e,n,{passive:i}):t.addEventListener(e,n,!1)}function Pc(t,e,n,r,i){var s=r;if(!(e&1)&&!(e&2)&&r!==null)e:for(;;){if(r===null)return;var o=r.tag;if(o===3||o===4){var l=r.stateNode.containerInfo;if(l===i||l.nodeType===8&&l.parentNode===i)break;if(o===4)for(o=r.return;o!==null;){var u=o.tag;if((u===3||u===4)&&(u=o.stateNode.containerInfo,u===i||u.nodeType===8&&u.parentNode===i))return;o=o.return}for(;l!==null;){if(o=wi(l),o===null)return;if(u=o.tag,u===5||u===6){r=s=o;continue e}l=l.parentNode}}r=r.return}I0(function(){var d=s,p=Rh(n),m=[];e:{var v=ny.get(t);if(v!==void 0){var I=Lh,A=t;switch(t){case"keypress":if(Sl(n)===0)break e;case"keydown":case"keyup":I=Aw;break;case"focusin":A="focus",I=Tc;break;case"focusout":A="blur",I=Tc;break;case"beforeblur":case"afterblur":I=Tc;break;case"click":if(n.button===2)break e;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":I=Mp;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":I=gw;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":I=Pw;break;case J0:case Z0:case ey:I=_w;break;case ty:I=Vw;break;case"scroll":I=pw;break;case"wheel":I=Mw;break;case"copy":case"cut":case"paste":I=xw;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":I=jp}var P=(e&4)!==0,M=!P&&t==="scroll",S=P?v!==null?v+"Capture":null:v;P=[];for(var x=d,k;x!==null;){k=x;var V=k.stateNode;if(k.tag===5&&V!==null&&(k=V,S!==null&&(V=Qo(x,S),V!=null&&P.push(na(x,V,k)))),M)break;x=x.return}0<P.length&&(v=new I(v,A,null,n,p),m.push({event:v,listeners:P}))}}if(!(e&7)){e:{if(v=t==="mouseover"||t==="pointerover",I=t==="mouseout"||t==="pointerout",v&&n!==hd&&(A=n.relatedTarget||n.fromElement)&&(wi(A)||A[Jn]))break e;if((I||v)&&(v=p.window===p?p:(v=p.ownerDocument)?v.defaultView||v.parentWindow:window,I?(A=n.relatedTarget||n.toElement,I=d,A=A?wi(A):null,A!==null&&(M=Li(A),A!==M||A.tag!==5&&A.tag!==6)&&(A=null)):(I=null,A=d),I!==A)){if(P=Mp,V="onMouseLeave",S="onMouseEnter",x="mouse",(t==="pointerout"||t==="pointerover")&&(P=jp,V="onPointerLeave",S="onPointerEnter",x="pointer"),M=I==null?v:us(I),k=A==null?v:us(A),v=new P(V,x+"leave",I,n,p),v.target=M,v.relatedTarget=k,V=null,wi(p)===d&&(P=new P(S,x+"enter",A,n,p),P.target=k,P.relatedTarget=M,V=P),M=V,I&&A)t:{for(P=I,S=A,x=0,k=P;k;k=Zi(k))x++;for(k=0,V=S;V;V=Zi(V))k++;for(;0<x-k;)P=Zi(P),x--;for(;0<k-x;)S=Zi(S),k--;for(;x--;){if(P===S||S!==null&&P===S.alternate)break t;P=Zi(P),S=Zi(S)}P=null}else P=null;I!==null&&Kp(m,v,I,P,!1),A!==null&&M!==null&&Kp(m,M,A,P,!0)}}e:{if(v=d?us(d):window,I=v.nodeName&&v.nodeName.toLowerCase(),I==="select"||I==="input"&&v.type==="file")var F=Bw;else if(zp(v))if(G0)F=Ww;else{F=qw;var B=$w}else(I=v.nodeName)&&I.toLowerCase()==="input"&&(v.type==="checkbox"||v.type==="radio")&&(F=Hw);if(F&&(F=F(t,d))){W0(m,F,n,p);break e}B&&B(t,v,d),t==="focusout"&&(B=v._wrapperState)&&B.controlled&&v.type==="number"&&ad(v,"number",v.value)}switch(B=d?us(d):window,t){case"focusin":(zp(B)||B.contentEditable==="true")&&(as=B,_d=d,jo=null);break;case"focusout":jo=_d=as=null;break;case"mousedown":wd=!0;break;case"contextmenu":case"mouseup":case"dragend":wd=!1,Hp(m,n,p);break;case"selectionchange":if(Qw)break;case"keydown":case"keyup":Hp(m,n,p)}var w;if(Oh)e:{switch(t){case"compositionstart":var y="onCompositionStart";break e;case"compositionend":y="onCompositionEnd";break e;case"compositionupdate":y="onCompositionUpdate";break e}y=void 0}else os?q0(t,n)&&(y="onCompositionEnd"):t==="keydown"&&n.keyCode===229&&(y="onCompositionStart");y&&($0&&n.locale!=="ko"&&(os||y!=="onCompositionStart"?y==="onCompositionEnd"&&os&&(w=B0()):(kr=p,Mh="value"in kr?kr.value:kr.textContent,os=!0)),B=Wl(d,y),0<B.length&&(y=new Lp(y,t,null,n,p),m.push({event:y,listeners:B}),w?y.data=w:(w=H0(n),w!==null&&(y.data=w)))),(w=jw?Ow(t,n):Fw(t,n))&&(d=Wl(d,"onBeforeInput"),0<d.length&&(p=new Lp("onBeforeInput","beforeinput",null,n,p),m.push({event:p,listeners:d}),p.data=w))}ry(m,e)})}function na(t,e,n){return{instance:t,listener:e,currentTarget:n}}function Wl(t,e){for(var n=e+"Capture",r=[];t!==null;){var i=t,s=i.stateNode;i.tag===5&&s!==null&&(i=s,s=Qo(t,n),s!=null&&r.unshift(na(t,s,i)),s=Qo(t,e),s!=null&&r.push(na(t,s,i))),t=t.return}return r}function Zi(t){if(t===null)return null;do t=t.return;while(t&&t.tag!==5);return t||null}function Kp(t,e,n,r,i){for(var s=e._reactName,o=[];n!==null&&n!==r;){var l=n,u=l.alternate,d=l.stateNode;if(u!==null&&u===r)break;l.tag===5&&d!==null&&(l=d,i?(u=Qo(n,s),u!=null&&o.unshift(na(n,u,l))):i||(u=Qo(n,s),u!=null&&o.push(na(n,u,l)))),n=n.return}o.length!==0&&t.push({event:e,listeners:o})}var Zw=/\r\n?/g,ex=/\u0000|\uFFFD/g;function Qp(t){return(typeof t=="string"?t:""+t).replace(Zw,`
`).replace(ex,"")}function sl(t,e,n){if(e=Qp(e),Qp(t)!==e&&n)throw Error(U(425))}function Gl(){}var xd=null,Ed=null;function bd(t,e){return t==="textarea"||t==="noscript"||typeof e.children=="string"||typeof e.children=="number"||typeof e.dangerouslySetInnerHTML=="object"&&e.dangerouslySetInnerHTML!==null&&e.dangerouslySetInnerHTML.__html!=null}var Td=typeof setTimeout=="function"?setTimeout:void 0,tx=typeof clearTimeout=="function"?clearTimeout:void 0,Yp=typeof Promise=="function"?Promise:void 0,nx=typeof queueMicrotask=="function"?queueMicrotask:typeof Yp<"u"?function(t){return Yp.resolve(null).then(t).catch(rx)}:Td;function rx(t){setTimeout(function(){throw t})}function Nc(t,e){var n=e,r=0;do{var i=n.nextSibling;if(t.removeChild(n),i&&i.nodeType===8)if(n=i.data,n==="/$"){if(r===0){t.removeChild(i),Jo(e);return}r--}else n!=="$"&&n!=="$?"&&n!=="$!"||r++;n=i}while(n);Jo(e)}function Nr(t){for(;t!=null;t=t.nextSibling){var e=t.nodeType;if(e===1||e===3)break;if(e===8){if(e=t.data,e==="$"||e==="$!"||e==="$?")break;if(e==="/$")return null}}return t}function Xp(t){t=t.previousSibling;for(var e=0;t;){if(t.nodeType===8){var n=t.data;if(n==="$"||n==="$!"||n==="$?"){if(e===0)return t;e--}else n==="/$"&&e++}t=t.previousSibling}return null}var Bs=Math.random().toString(36).slice(2),Vn="__reactFiber$"+Bs,ra="__reactProps$"+Bs,Jn="__reactContainer$"+Bs,Sd="__reactEvents$"+Bs,ix="__reactListeners$"+Bs,sx="__reactHandles$"+Bs;function wi(t){var e=t[Vn];if(e)return e;for(var n=t.parentNode;n;){if(e=n[Jn]||n[Vn]){if(n=e.alternate,e.child!==null||n!==null&&n.child!==null)for(t=Xp(t);t!==null;){if(n=t[Vn])return n;t=Xp(t)}return e}t=n,n=t.parentNode}return null}function Sa(t){return t=t[Vn]||t[Jn],!t||t.tag!==5&&t.tag!==6&&t.tag!==13&&t.tag!==3?null:t}function us(t){if(t.tag===5||t.tag===6)return t.stateNode;throw Error(U(33))}function Nu(t){return t[ra]||null}var kd=[],cs=-1;function Xr(t){return{current:t}}function Ie(t){0>cs||(t.current=kd[cs],kd[cs]=null,cs--)}function be(t,e){cs++,kd[cs]=t.current,t.current=e}var $r={},Et=Xr($r),Mt=Xr(!1),Ii=$r;function As(t,e){var n=t.type.contextTypes;if(!n)return $r;var r=t.stateNode;if(r&&r.__reactInternalMemoizedUnmaskedChildContext===e)return r.__reactInternalMemoizedMaskedChildContext;var i={},s;for(s in n)i[s]=e[s];return r&&(t=t.stateNode,t.__reactInternalMemoizedUnmaskedChildContext=e,t.__reactInternalMemoizedMaskedChildContext=i),i}function Lt(t){return t=t.childContextTypes,t!=null}function Kl(){Ie(Mt),Ie(Et)}function Jp(t,e,n){if(Et.current!==$r)throw Error(U(168));be(Et,e),be(Mt,n)}function sy(t,e,n){var r=t.stateNode;if(e=e.childContextTypes,typeof r.getChildContext!="function")return n;r=r.getChildContext();for(var i in r)if(!(i in e))throw Error(U(108,$_(t)||"Unknown",i));return De({},n,r)}function Ql(t){return t=(t=t.stateNode)&&t.__reactInternalMemoizedMergedChildContext||$r,Ii=Et.current,be(Et,t),be(Mt,Mt.current),!0}function Zp(t,e,n){var r=t.stateNode;if(!r)throw Error(U(169));n?(t=sy(t,e,Ii),r.__reactInternalMemoizedMergedChildContext=t,Ie(Mt),Ie(Et),be(Et,t)):Ie(Mt),be(Mt,n)}var Wn=null,Vu=!1,Vc=!1;function oy(t){Wn===null?Wn=[t]:Wn.push(t)}function ox(t){Vu=!0,oy(t)}function Jr(){if(!Vc&&Wn!==null){Vc=!0;var t=0,e=_e;try{var n=Wn;for(_e=1;t<n.length;t++){var r=n[t];do r=r(!0);while(r!==null)}Wn=null,Vu=!1}catch(i){throw Wn!==null&&(Wn=Wn.slice(t+1)),P0(Ph,Jr),i}finally{_e=e,Vc=!1}}return null}var ds=[],hs=0,Yl=null,Xl=0,en=[],tn=0,Ai=null,Gn=1,Kn="";function yi(t,e){ds[hs++]=Xl,ds[hs++]=Yl,Yl=t,Xl=e}function ay(t,e,n){en[tn++]=Gn,en[tn++]=Kn,en[tn++]=Ai,Ai=t;var r=Gn;t=Kn;var i=32-_n(r)-1;r&=~(1<<i),n+=1;var s=32-_n(e)+i;if(30<s){var o=i-i%5;s=(r&(1<<o)-1).toString(32),r>>=o,i-=o,Gn=1<<32-_n(e)+i|n<<i|r,Kn=s+t}else Gn=1<<s|n<<i|r,Kn=t}function zh(t){t.return!==null&&(yi(t,1),ay(t,1,0))}function Uh(t){for(;t===Yl;)Yl=ds[--hs],ds[hs]=null,Xl=ds[--hs],ds[hs]=null;for(;t===Ai;)Ai=en[--tn],en[tn]=null,Kn=en[--tn],en[tn]=null,Gn=en[--tn],en[tn]=null}var Ut=null,zt=null,Ce=!1,yn=null;function ly(t,e){var n=sn(5,null,null,0);n.elementType="DELETED",n.stateNode=e,n.return=t,e=t.deletions,e===null?(t.deletions=[n],t.flags|=16):e.push(n)}function em(t,e){switch(t.tag){case 5:var n=t.type;return e=e.nodeType!==1||n.toLowerCase()!==e.nodeName.toLowerCase()?null:e,e!==null?(t.stateNode=e,Ut=t,zt=Nr(e.firstChild),!0):!1;case 6:return e=t.pendingProps===""||e.nodeType!==3?null:e,e!==null?(t.stateNode=e,Ut=t,zt=null,!0):!1;case 13:return e=e.nodeType!==8?null:e,e!==null?(n=Ai!==null?{id:Gn,overflow:Kn}:null,t.memoizedState={dehydrated:e,treeContext:n,retryLane:1073741824},n=sn(18,null,null,0),n.stateNode=e,n.return=t,t.child=n,Ut=t,zt=null,!0):!1;default:return!1}}function Id(t){return(t.mode&1)!==0&&(t.flags&128)===0}function Ad(t){if(Ce){var e=zt;if(e){var n=e;if(!em(t,e)){if(Id(t))throw Error(U(418));e=Nr(n.nextSibling);var r=Ut;e&&em(t,e)?ly(r,n):(t.flags=t.flags&-4097|2,Ce=!1,Ut=t)}}else{if(Id(t))throw Error(U(418));t.flags=t.flags&-4097|2,Ce=!1,Ut=t}}}function tm(t){for(t=t.return;t!==null&&t.tag!==5&&t.tag!==3&&t.tag!==13;)t=t.return;Ut=t}function ol(t){if(t!==Ut)return!1;if(!Ce)return tm(t),Ce=!0,!1;var e;if((e=t.tag!==3)&&!(e=t.tag!==5)&&(e=t.type,e=e!=="head"&&e!=="body"&&!bd(t.type,t.memoizedProps)),e&&(e=zt)){if(Id(t))throw uy(),Error(U(418));for(;e;)ly(t,e),e=Nr(e.nextSibling)}if(tm(t),t.tag===13){if(t=t.memoizedState,t=t!==null?t.dehydrated:null,!t)throw Error(U(317));e:{for(t=t.nextSibling,e=0;t;){if(t.nodeType===8){var n=t.data;if(n==="/$"){if(e===0){zt=Nr(t.nextSibling);break e}e--}else n!=="$"&&n!=="$!"&&n!=="$?"||e++}t=t.nextSibling}zt=null}}else zt=Ut?Nr(t.stateNode.nextSibling):null;return!0}function uy(){for(var t=zt;t;)t=Nr(t.nextSibling)}function Cs(){zt=Ut=null,Ce=!1}function Bh(t){yn===null?yn=[t]:yn.push(t)}var ax=ir.ReactCurrentBatchConfig;function _o(t,e,n){if(t=n.ref,t!==null&&typeof t!="function"&&typeof t!="object"){if(n._owner){if(n=n._owner,n){if(n.tag!==1)throw Error(U(309));var r=n.stateNode}if(!r)throw Error(U(147,t));var i=r,s=""+t;return e!==null&&e.ref!==null&&typeof e.ref=="function"&&e.ref._stringRef===s?e.ref:(e=function(o){var l=i.refs;o===null?delete l[s]:l[s]=o},e._stringRef=s,e)}if(typeof t!="string")throw Error(U(284));if(!n._owner)throw Error(U(290,t))}return t}function al(t,e){throw t=Object.prototype.toString.call(e),Error(U(31,t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t))}function nm(t){var e=t._init;return e(t._payload)}function cy(t){function e(S,x){if(t){var k=S.deletions;k===null?(S.deletions=[x],S.flags|=16):k.push(x)}}function n(S,x){if(!t)return null;for(;x!==null;)e(S,x),x=x.sibling;return null}function r(S,x){for(S=new Map;x!==null;)x.key!==null?S.set(x.key,x):S.set(x.index,x),x=x.sibling;return S}function i(S,x){return S=Lr(S,x),S.index=0,S.sibling=null,S}function s(S,x,k){return S.index=k,t?(k=S.alternate,k!==null?(k=k.index,k<x?(S.flags|=2,x):k):(S.flags|=2,x)):(S.flags|=1048576,x)}function o(S){return t&&S.alternate===null&&(S.flags|=2),S}function l(S,x,k,V){return x===null||x.tag!==6?(x=zc(k,S.mode,V),x.return=S,x):(x=i(x,k),x.return=S,x)}function u(S,x,k,V){var F=k.type;return F===ss?p(S,x,k.props.children,V,k.key):x!==null&&(x.elementType===F||typeof F=="object"&&F!==null&&F.$$typeof===Er&&nm(F)===x.type)?(V=i(x,k.props),V.ref=_o(S,x,k),V.return=S,V):(V=Nl(k.type,k.key,k.props,null,S.mode,V),V.ref=_o(S,x,k),V.return=S,V)}function d(S,x,k,V){return x===null||x.tag!==4||x.stateNode.containerInfo!==k.containerInfo||x.stateNode.implementation!==k.implementation?(x=Uc(k,S.mode,V),x.return=S,x):(x=i(x,k.children||[]),x.return=S,x)}function p(S,x,k,V,F){return x===null||x.tag!==7?(x=ki(k,S.mode,V,F),x.return=S,x):(x=i(x,k),x.return=S,x)}function m(S,x,k){if(typeof x=="string"&&x!==""||typeof x=="number")return x=zc(""+x,S.mode,k),x.return=S,x;if(typeof x=="object"&&x!==null){switch(x.$$typeof){case Ya:return k=Nl(x.type,x.key,x.props,null,S.mode,k),k.ref=_o(S,null,x),k.return=S,k;case is:return x=Uc(x,S.mode,k),x.return=S,x;case Er:var V=x._init;return m(S,V(x._payload),k)}if(ko(x)||po(x))return x=ki(x,S.mode,k,null),x.return=S,x;al(S,x)}return null}function v(S,x,k,V){var F=x!==null?x.key:null;if(typeof k=="string"&&k!==""||typeof k=="number")return F!==null?null:l(S,x,""+k,V);if(typeof k=="object"&&k!==null){switch(k.$$typeof){case Ya:return k.key===F?u(S,x,k,V):null;case is:return k.key===F?d(S,x,k,V):null;case Er:return F=k._init,v(S,x,F(k._payload),V)}if(ko(k)||po(k))return F!==null?null:p(S,x,k,V,null);al(S,k)}return null}function I(S,x,k,V,F){if(typeof V=="string"&&V!==""||typeof V=="number")return S=S.get(k)||null,l(x,S,""+V,F);if(typeof V=="object"&&V!==null){switch(V.$$typeof){case Ya:return S=S.get(V.key===null?k:V.key)||null,u(x,S,V,F);case is:return S=S.get(V.key===null?k:V.key)||null,d(x,S,V,F);case Er:var B=V._init;return I(S,x,k,B(V._payload),F)}if(ko(V)||po(V))return S=S.get(k)||null,p(x,S,V,F,null);al(x,V)}return null}function A(S,x,k,V){for(var F=null,B=null,w=x,y=x=0,_=null;w!==null&&y<k.length;y++){w.index>y?(_=w,w=null):_=w.sibling;var b=v(S,w,k[y],V);if(b===null){w===null&&(w=_);break}t&&w&&b.alternate===null&&e(S,w),x=s(b,x,y),B===null?F=b:B.sibling=b,B=b,w=_}if(y===k.length)return n(S,w),Ce&&yi(S,y),F;if(w===null){for(;y<k.length;y++)w=m(S,k[y],V),w!==null&&(x=s(w,x,y),B===null?F=w:B.sibling=w,B=w);return Ce&&yi(S,y),F}for(w=r(S,w);y<k.length;y++)_=I(w,S,y,k[y],V),_!==null&&(t&&_.alternate!==null&&w.delete(_.key===null?y:_.key),x=s(_,x,y),B===null?F=_:B.sibling=_,B=_);return t&&w.forEach(function(T){return e(S,T)}),Ce&&yi(S,y),F}function P(S,x,k,V){var F=po(k);if(typeof F!="function")throw Error(U(150));if(k=F.call(k),k==null)throw Error(U(151));for(var B=F=null,w=x,y=x=0,_=null,b=k.next();w!==null&&!b.done;y++,b=k.next()){w.index>y?(_=w,w=null):_=w.sibling;var T=v(S,w,b.value,V);if(T===null){w===null&&(w=_);break}t&&w&&T.alternate===null&&e(S,w),x=s(T,x,y),B===null?F=T:B.sibling=T,B=T,w=_}if(b.done)return n(S,w),Ce&&yi(S,y),F;if(w===null){for(;!b.done;y++,b=k.next())b=m(S,b.value,V),b!==null&&(x=s(b,x,y),B===null?F=b:B.sibling=b,B=b);return Ce&&yi(S,y),F}for(w=r(S,w);!b.done;y++,b=k.next())b=I(w,S,y,b.value,V),b!==null&&(t&&b.alternate!==null&&w.delete(b.key===null?y:b.key),x=s(b,x,y),B===null?F=b:B.sibling=b,B=b);return t&&w.forEach(function(C){return e(S,C)}),Ce&&yi(S,y),F}function M(S,x,k,V){if(typeof k=="object"&&k!==null&&k.type===ss&&k.key===null&&(k=k.props.children),typeof k=="object"&&k!==null){switch(k.$$typeof){case Ya:e:{for(var F=k.key,B=x;B!==null;){if(B.key===F){if(F=k.type,F===ss){if(B.tag===7){n(S,B.sibling),x=i(B,k.props.children),x.return=S,S=x;break e}}else if(B.elementType===F||typeof F=="object"&&F!==null&&F.$$typeof===Er&&nm(F)===B.type){n(S,B.sibling),x=i(B,k.props),x.ref=_o(S,B,k),x.return=S,S=x;break e}n(S,B);break}else e(S,B);B=B.sibling}k.type===ss?(x=ki(k.props.children,S.mode,V,k.key),x.return=S,S=x):(V=Nl(k.type,k.key,k.props,null,S.mode,V),V.ref=_o(S,x,k),V.return=S,S=V)}return o(S);case is:e:{for(B=k.key;x!==null;){if(x.key===B)if(x.tag===4&&x.stateNode.containerInfo===k.containerInfo&&x.stateNode.implementation===k.implementation){n(S,x.sibling),x=i(x,k.children||[]),x.return=S,S=x;break e}else{n(S,x);break}else e(S,x);x=x.sibling}x=Uc(k,S.mode,V),x.return=S,S=x}return o(S);case Er:return B=k._init,M(S,x,B(k._payload),V)}if(ko(k))return A(S,x,k,V);if(po(k))return P(S,x,k,V);al(S,k)}return typeof k=="string"&&k!==""||typeof k=="number"?(k=""+k,x!==null&&x.tag===6?(n(S,x.sibling),x=i(x,k),x.return=S,S=x):(n(S,x),x=zc(k,S.mode,V),x.return=S,S=x),o(S)):n(S,x)}return M}var Rs=cy(!0),dy=cy(!1),Jl=Xr(null),Zl=null,fs=null,$h=null;function qh(){$h=fs=Zl=null}function Hh(t){var e=Jl.current;Ie(Jl),t._currentValue=e}function Cd(t,e,n){for(;t!==null;){var r=t.alternate;if((t.childLanes&e)!==e?(t.childLanes|=e,r!==null&&(r.childLanes|=e)):r!==null&&(r.childLanes&e)!==e&&(r.childLanes|=e),t===n)break;t=t.return}}function ws(t,e){Zl=t,$h=fs=null,t=t.dependencies,t!==null&&t.firstContext!==null&&(t.lanes&e&&(Dt=!0),t.firstContext=null)}function an(t){var e=t._currentValue;if($h!==t)if(t={context:t,memoizedValue:e,next:null},fs===null){if(Zl===null)throw Error(U(308));fs=t,Zl.dependencies={lanes:0,firstContext:t}}else fs=fs.next=t;return e}var xi=null;function Wh(t){xi===null?xi=[t]:xi.push(t)}function hy(t,e,n,r){var i=e.interleaved;return i===null?(n.next=n,Wh(e)):(n.next=i.next,i.next=n),e.interleaved=n,Zn(t,r)}function Zn(t,e){t.lanes|=e;var n=t.alternate;for(n!==null&&(n.lanes|=e),n=t,t=t.return;t!==null;)t.childLanes|=e,n=t.alternate,n!==null&&(n.childLanes|=e),n=t,t=t.return;return n.tag===3?n.stateNode:null}var br=!1;function Gh(t){t.updateQueue={baseState:t.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null}}function fy(t,e){t=t.updateQueue,e.updateQueue===t&&(e.updateQueue={baseState:t.baseState,firstBaseUpdate:t.firstBaseUpdate,lastBaseUpdate:t.lastBaseUpdate,shared:t.shared,effects:t.effects})}function Qn(t,e){return{eventTime:t,lane:e,tag:0,payload:null,callback:null,next:null}}function Vr(t,e,n){var r=t.updateQueue;if(r===null)return null;if(r=r.shared,ge&2){var i=r.pending;return i===null?e.next=e:(e.next=i.next,i.next=e),r.pending=e,Zn(t,n)}return i=r.interleaved,i===null?(e.next=e,Wh(r)):(e.next=i.next,i.next=e),r.interleaved=e,Zn(t,n)}function kl(t,e,n){if(e=e.updateQueue,e!==null&&(e=e.shared,(n&4194240)!==0)){var r=e.lanes;r&=t.pendingLanes,n|=r,e.lanes=n,Nh(t,n)}}function rm(t,e){var n=t.updateQueue,r=t.alternate;if(r!==null&&(r=r.updateQueue,n===r)){var i=null,s=null;if(n=n.firstBaseUpdate,n!==null){do{var o={eventTime:n.eventTime,lane:n.lane,tag:n.tag,payload:n.payload,callback:n.callback,next:null};s===null?i=s=o:s=s.next=o,n=n.next}while(n!==null);s===null?i=s=e:s=s.next=e}else i=s=e;n={baseState:r.baseState,firstBaseUpdate:i,lastBaseUpdate:s,shared:r.shared,effects:r.effects},t.updateQueue=n;return}t=n.lastBaseUpdate,t===null?n.firstBaseUpdate=e:t.next=e,n.lastBaseUpdate=e}function eu(t,e,n,r){var i=t.updateQueue;br=!1;var s=i.firstBaseUpdate,o=i.lastBaseUpdate,l=i.shared.pending;if(l!==null){i.shared.pending=null;var u=l,d=u.next;u.next=null,o===null?s=d:o.next=d,o=u;var p=t.alternate;p!==null&&(p=p.updateQueue,l=p.lastBaseUpdate,l!==o&&(l===null?p.firstBaseUpdate=d:l.next=d,p.lastBaseUpdate=u))}if(s!==null){var m=i.baseState;o=0,p=d=u=null,l=s;do{var v=l.lane,I=l.eventTime;if((r&v)===v){p!==null&&(p=p.next={eventTime:I,lane:0,tag:l.tag,payload:l.payload,callback:l.callback,next:null});e:{var A=t,P=l;switch(v=e,I=n,P.tag){case 1:if(A=P.payload,typeof A=="function"){m=A.call(I,m,v);break e}m=A;break e;case 3:A.flags=A.flags&-65537|128;case 0:if(A=P.payload,v=typeof A=="function"?A.call(I,m,v):A,v==null)break e;m=De({},m,v);break e;case 2:br=!0}}l.callback!==null&&l.lane!==0&&(t.flags|=64,v=i.effects,v===null?i.effects=[l]:v.push(l))}else I={eventTime:I,lane:v,tag:l.tag,payload:l.payload,callback:l.callback,next:null},p===null?(d=p=I,u=m):p=p.next=I,o|=v;if(l=l.next,l===null){if(l=i.shared.pending,l===null)break;v=l,l=v.next,v.next=null,i.lastBaseUpdate=v,i.shared.pending=null}}while(!0);if(p===null&&(u=m),i.baseState=u,i.firstBaseUpdate=d,i.lastBaseUpdate=p,e=i.shared.interleaved,e!==null){i=e;do o|=i.lane,i=i.next;while(i!==e)}else s===null&&(i.shared.lanes=0);Ri|=o,t.lanes=o,t.memoizedState=m}}function im(t,e,n){if(t=e.effects,e.effects=null,t!==null)for(e=0;e<t.length;e++){var r=t[e],i=r.callback;if(i!==null){if(r.callback=null,r=n,typeof i!="function")throw Error(U(191,i));i.call(r)}}}var ka={},Ln=Xr(ka),ia=Xr(ka),sa=Xr(ka);function Ei(t){if(t===ka)throw Error(U(174));return t}function Kh(t,e){switch(be(sa,e),be(ia,t),be(Ln,ka),t=e.nodeType,t){case 9:case 11:e=(e=e.documentElement)?e.namespaceURI:ud(null,"");break;default:t=t===8?e.parentNode:e,e=t.namespaceURI||null,t=t.tagName,e=ud(e,t)}Ie(Ln),be(Ln,e)}function Ps(){Ie(Ln),Ie(ia),Ie(sa)}function py(t){Ei(sa.current);var e=Ei(Ln.current),n=ud(e,t.type);e!==n&&(be(ia,t),be(Ln,n))}function Qh(t){ia.current===t&&(Ie(Ln),Ie(ia))}var Ne=Xr(0);function tu(t){for(var e=t;e!==null;){if(e.tag===13){var n=e.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||n.data==="$?"||n.data==="$!"))return e}else if(e.tag===19&&e.memoizedProps.revealOrder!==void 0){if(e.flags&128)return e}else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return null;e=e.return}e.sibling.return=e.return,e=e.sibling}return null}var Dc=[];function Yh(){for(var t=0;t<Dc.length;t++)Dc[t]._workInProgressVersionPrimary=null;Dc.length=0}var Il=ir.ReactCurrentDispatcher,Mc=ir.ReactCurrentBatchConfig,Ci=0,Ve=null,Xe=null,ot=null,nu=!1,Oo=!1,oa=0,lx=0;function gt(){throw Error(U(321))}function Xh(t,e){if(e===null)return!1;for(var n=0;n<e.length&&n<t.length;n++)if(!En(t[n],e[n]))return!1;return!0}function Jh(t,e,n,r,i,s){if(Ci=s,Ve=e,e.memoizedState=null,e.updateQueue=null,e.lanes=0,Il.current=t===null||t.memoizedState===null?hx:fx,t=n(r,i),Oo){s=0;do{if(Oo=!1,oa=0,25<=s)throw Error(U(301));s+=1,ot=Xe=null,e.updateQueue=null,Il.current=px,t=n(r,i)}while(Oo)}if(Il.current=ru,e=Xe!==null&&Xe.next!==null,Ci=0,ot=Xe=Ve=null,nu=!1,e)throw Error(U(300));return t}function Zh(){var t=oa!==0;return oa=0,t}function Pn(){var t={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return ot===null?Ve.memoizedState=ot=t:ot=ot.next=t,ot}function ln(){if(Xe===null){var t=Ve.alternate;t=t!==null?t.memoizedState:null}else t=Xe.next;var e=ot===null?Ve.memoizedState:ot.next;if(e!==null)ot=e,Xe=t;else{if(t===null)throw Error(U(310));Xe=t,t={memoizedState:Xe.memoizedState,baseState:Xe.baseState,baseQueue:Xe.baseQueue,queue:Xe.queue,next:null},ot===null?Ve.memoizedState=ot=t:ot=ot.next=t}return ot}function aa(t,e){return typeof e=="function"?e(t):e}function Lc(t){var e=ln(),n=e.queue;if(n===null)throw Error(U(311));n.lastRenderedReducer=t;var r=Xe,i=r.baseQueue,s=n.pending;if(s!==null){if(i!==null){var o=i.next;i.next=s.next,s.next=o}r.baseQueue=i=s,n.pending=null}if(i!==null){s=i.next,r=r.baseState;var l=o=null,u=null,d=s;do{var p=d.lane;if((Ci&p)===p)u!==null&&(u=u.next={lane:0,action:d.action,hasEagerState:d.hasEagerState,eagerState:d.eagerState,next:null}),r=d.hasEagerState?d.eagerState:t(r,d.action);else{var m={lane:p,action:d.action,hasEagerState:d.hasEagerState,eagerState:d.eagerState,next:null};u===null?(l=u=m,o=r):u=u.next=m,Ve.lanes|=p,Ri|=p}d=d.next}while(d!==null&&d!==s);u===null?o=r:u.next=l,En(r,e.memoizedState)||(Dt=!0),e.memoizedState=r,e.baseState=o,e.baseQueue=u,n.lastRenderedState=r}if(t=n.interleaved,t!==null){i=t;do s=i.lane,Ve.lanes|=s,Ri|=s,i=i.next;while(i!==t)}else i===null&&(n.lanes=0);return[e.memoizedState,n.dispatch]}function jc(t){var e=ln(),n=e.queue;if(n===null)throw Error(U(311));n.lastRenderedReducer=t;var r=n.dispatch,i=n.pending,s=e.memoizedState;if(i!==null){n.pending=null;var o=i=i.next;do s=t(s,o.action),o=o.next;while(o!==i);En(s,e.memoizedState)||(Dt=!0),e.memoizedState=s,e.baseQueue===null&&(e.baseState=s),n.lastRenderedState=s}return[s,r]}function my(){}function gy(t,e){var n=Ve,r=ln(),i=e(),s=!En(r.memoizedState,i);if(s&&(r.memoizedState=i,Dt=!0),r=r.queue,ef(_y.bind(null,n,r,t),[t]),r.getSnapshot!==e||s||ot!==null&&ot.memoizedState.tag&1){if(n.flags|=2048,la(9,vy.bind(null,n,r,i,e),void 0,null),lt===null)throw Error(U(349));Ci&30||yy(n,e,i)}return i}function yy(t,e,n){t.flags|=16384,t={getSnapshot:e,value:n},e=Ve.updateQueue,e===null?(e={lastEffect:null,stores:null},Ve.updateQueue=e,e.stores=[t]):(n=e.stores,n===null?e.stores=[t]:n.push(t))}function vy(t,e,n,r){e.value=n,e.getSnapshot=r,wy(e)&&xy(t)}function _y(t,e,n){return n(function(){wy(e)&&xy(t)})}function wy(t){var e=t.getSnapshot;t=t.value;try{var n=e();return!En(t,n)}catch{return!0}}function xy(t){var e=Zn(t,1);e!==null&&wn(e,t,1,-1)}function sm(t){var e=Pn();return typeof t=="function"&&(t=t()),e.memoizedState=e.baseState=t,t={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:aa,lastRenderedState:t},e.queue=t,t=t.dispatch=dx.bind(null,Ve,t),[e.memoizedState,t]}function la(t,e,n,r){return t={tag:t,create:e,destroy:n,deps:r,next:null},e=Ve.updateQueue,e===null?(e={lastEffect:null,stores:null},Ve.updateQueue=e,e.lastEffect=t.next=t):(n=e.lastEffect,n===null?e.lastEffect=t.next=t:(r=n.next,n.next=t,t.next=r,e.lastEffect=t)),t}function Ey(){return ln().memoizedState}function Al(t,e,n,r){var i=Pn();Ve.flags|=t,i.memoizedState=la(1|e,n,void 0,r===void 0?null:r)}function Du(t,e,n,r){var i=ln();r=r===void 0?null:r;var s=void 0;if(Xe!==null){var o=Xe.memoizedState;if(s=o.destroy,r!==null&&Xh(r,o.deps)){i.memoizedState=la(e,n,s,r);return}}Ve.flags|=t,i.memoizedState=la(1|e,n,s,r)}function om(t,e){return Al(8390656,8,t,e)}function ef(t,e){return Du(2048,8,t,e)}function by(t,e){return Du(4,2,t,e)}function Ty(t,e){return Du(4,4,t,e)}function Sy(t,e){if(typeof e=="function")return t=t(),e(t),function(){e(null)};if(e!=null)return t=t(),e.current=t,function(){e.current=null}}function ky(t,e,n){return n=n!=null?n.concat([t]):null,Du(4,4,Sy.bind(null,e,t),n)}function tf(){}function Iy(t,e){var n=ln();e=e===void 0?null:e;var r=n.memoizedState;return r!==null&&e!==null&&Xh(e,r[1])?r[0]:(n.memoizedState=[t,e],t)}function Ay(t,e){var n=ln();e=e===void 0?null:e;var r=n.memoizedState;return r!==null&&e!==null&&Xh(e,r[1])?r[0]:(t=t(),n.memoizedState=[t,e],t)}function Cy(t,e,n){return Ci&21?(En(n,e)||(n=D0(),Ve.lanes|=n,Ri|=n,t.baseState=!0),e):(t.baseState&&(t.baseState=!1,Dt=!0),t.memoizedState=n)}function ux(t,e){var n=_e;_e=n!==0&&4>n?n:4,t(!0);var r=Mc.transition;Mc.transition={};try{t(!1),e()}finally{_e=n,Mc.transition=r}}function Ry(){return ln().memoizedState}function cx(t,e,n){var r=Mr(t);if(n={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null},Py(t))Ny(e,n);else if(n=hy(t,e,n,r),n!==null){var i=It();wn(n,t,r,i),Vy(n,e,r)}}function dx(t,e,n){var r=Mr(t),i={lane:r,action:n,hasEagerState:!1,eagerState:null,next:null};if(Py(t))Ny(e,i);else{var s=t.alternate;if(t.lanes===0&&(s===null||s.lanes===0)&&(s=e.lastRenderedReducer,s!==null))try{var o=e.lastRenderedState,l=s(o,n);if(i.hasEagerState=!0,i.eagerState=l,En(l,o)){var u=e.interleaved;u===null?(i.next=i,Wh(e)):(i.next=u.next,u.next=i),e.interleaved=i;return}}catch{}finally{}n=hy(t,e,i,r),n!==null&&(i=It(),wn(n,t,r,i),Vy(n,e,r))}}function Py(t){var e=t.alternate;return t===Ve||e!==null&&e===Ve}function Ny(t,e){Oo=nu=!0;var n=t.pending;n===null?e.next=e:(e.next=n.next,n.next=e),t.pending=e}function Vy(t,e,n){if(n&4194240){var r=e.lanes;r&=t.pendingLanes,n|=r,e.lanes=n,Nh(t,n)}}var ru={readContext:an,useCallback:gt,useContext:gt,useEffect:gt,useImperativeHandle:gt,useInsertionEffect:gt,useLayoutEffect:gt,useMemo:gt,useReducer:gt,useRef:gt,useState:gt,useDebugValue:gt,useDeferredValue:gt,useTransition:gt,useMutableSource:gt,useSyncExternalStore:gt,useId:gt,unstable_isNewReconciler:!1},hx={readContext:an,useCallback:function(t,e){return Pn().memoizedState=[t,e===void 0?null:e],t},useContext:an,useEffect:om,useImperativeHandle:function(t,e,n){return n=n!=null?n.concat([t]):null,Al(4194308,4,Sy.bind(null,e,t),n)},useLayoutEffect:function(t,e){return Al(4194308,4,t,e)},useInsertionEffect:function(t,e){return Al(4,2,t,e)},useMemo:function(t,e){var n=Pn();return e=e===void 0?null:e,t=t(),n.memoizedState=[t,e],t},useReducer:function(t,e,n){var r=Pn();return e=n!==void 0?n(e):e,r.memoizedState=r.baseState=e,t={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:t,lastRenderedState:e},r.queue=t,t=t.dispatch=cx.bind(null,Ve,t),[r.memoizedState,t]},useRef:function(t){var e=Pn();return t={current:t},e.memoizedState=t},useState:sm,useDebugValue:tf,useDeferredValue:function(t){return Pn().memoizedState=t},useTransition:function(){var t=sm(!1),e=t[0];return t=ux.bind(null,t[1]),Pn().memoizedState=t,[e,t]},useMutableSource:function(){},useSyncExternalStore:function(t,e,n){var r=Ve,i=Pn();if(Ce){if(n===void 0)throw Error(U(407));n=n()}else{if(n=e(),lt===null)throw Error(U(349));Ci&30||yy(r,e,n)}i.memoizedState=n;var s={value:n,getSnapshot:e};return i.queue=s,om(_y.bind(null,r,s,t),[t]),r.flags|=2048,la(9,vy.bind(null,r,s,n,e),void 0,null),n},useId:function(){var t=Pn(),e=lt.identifierPrefix;if(Ce){var n=Kn,r=Gn;n=(r&~(1<<32-_n(r)-1)).toString(32)+n,e=":"+e+"R"+n,n=oa++,0<n&&(e+="H"+n.toString(32)),e+=":"}else n=lx++,e=":"+e+"r"+n.toString(32)+":";return t.memoizedState=e},unstable_isNewReconciler:!1},fx={readContext:an,useCallback:Iy,useContext:an,useEffect:ef,useImperativeHandle:ky,useInsertionEffect:by,useLayoutEffect:Ty,useMemo:Ay,useReducer:Lc,useRef:Ey,useState:function(){return Lc(aa)},useDebugValue:tf,useDeferredValue:function(t){var e=ln();return Cy(e,Xe.memoizedState,t)},useTransition:function(){var t=Lc(aa)[0],e=ln().memoizedState;return[t,e]},useMutableSource:my,useSyncExternalStore:gy,useId:Ry,unstable_isNewReconciler:!1},px={readContext:an,useCallback:Iy,useContext:an,useEffect:ef,useImperativeHandle:ky,useInsertionEffect:by,useLayoutEffect:Ty,useMemo:Ay,useReducer:jc,useRef:Ey,useState:function(){return jc(aa)},useDebugValue:tf,useDeferredValue:function(t){var e=ln();return Xe===null?e.memoizedState=t:Cy(e,Xe.memoizedState,t)},useTransition:function(){var t=jc(aa)[0],e=ln().memoizedState;return[t,e]},useMutableSource:my,useSyncExternalStore:gy,useId:Ry,unstable_isNewReconciler:!1};function mn(t,e){if(t&&t.defaultProps){e=De({},e),t=t.defaultProps;for(var n in t)e[n]===void 0&&(e[n]=t[n]);return e}return e}function Rd(t,e,n,r){e=t.memoizedState,n=n(r,e),n=n==null?e:De({},e,n),t.memoizedState=n,t.lanes===0&&(t.updateQueue.baseState=n)}var Mu={isMounted:function(t){return(t=t._reactInternals)?Li(t)===t:!1},enqueueSetState:function(t,e,n){t=t._reactInternals;var r=It(),i=Mr(t),s=Qn(r,i);s.payload=e,n!=null&&(s.callback=n),e=Vr(t,s,i),e!==null&&(wn(e,t,i,r),kl(e,t,i))},enqueueReplaceState:function(t,e,n){t=t._reactInternals;var r=It(),i=Mr(t),s=Qn(r,i);s.tag=1,s.payload=e,n!=null&&(s.callback=n),e=Vr(t,s,i),e!==null&&(wn(e,t,i,r),kl(e,t,i))},enqueueForceUpdate:function(t,e){t=t._reactInternals;var n=It(),r=Mr(t),i=Qn(n,r);i.tag=2,e!=null&&(i.callback=e),e=Vr(t,i,r),e!==null&&(wn(e,t,r,n),kl(e,t,r))}};function am(t,e,n,r,i,s,o){return t=t.stateNode,typeof t.shouldComponentUpdate=="function"?t.shouldComponentUpdate(r,s,o):e.prototype&&e.prototype.isPureReactComponent?!ea(n,r)||!ea(i,s):!0}function Dy(t,e,n){var r=!1,i=$r,s=e.contextType;return typeof s=="object"&&s!==null?s=an(s):(i=Lt(e)?Ii:Et.current,r=e.contextTypes,s=(r=r!=null)?As(t,i):$r),e=new e(n,s),t.memoizedState=e.state!==null&&e.state!==void 0?e.state:null,e.updater=Mu,t.stateNode=e,e._reactInternals=t,r&&(t=t.stateNode,t.__reactInternalMemoizedUnmaskedChildContext=i,t.__reactInternalMemoizedMaskedChildContext=s),e}function lm(t,e,n,r){t=e.state,typeof e.componentWillReceiveProps=="function"&&e.componentWillReceiveProps(n,r),typeof e.UNSAFE_componentWillReceiveProps=="function"&&e.UNSAFE_componentWillReceiveProps(n,r),e.state!==t&&Mu.enqueueReplaceState(e,e.state,null)}function Pd(t,e,n,r){var i=t.stateNode;i.props=n,i.state=t.memoizedState,i.refs={},Gh(t);var s=e.contextType;typeof s=="object"&&s!==null?i.context=an(s):(s=Lt(e)?Ii:Et.current,i.context=As(t,s)),i.state=t.memoizedState,s=e.getDerivedStateFromProps,typeof s=="function"&&(Rd(t,e,s,n),i.state=t.memoizedState),typeof e.getDerivedStateFromProps=="function"||typeof i.getSnapshotBeforeUpdate=="function"||typeof i.UNSAFE_componentWillMount!="function"&&typeof i.componentWillMount!="function"||(e=i.state,typeof i.componentWillMount=="function"&&i.componentWillMount(),typeof i.UNSAFE_componentWillMount=="function"&&i.UNSAFE_componentWillMount(),e!==i.state&&Mu.enqueueReplaceState(i,i.state,null),eu(t,n,i,r),i.state=t.memoizedState),typeof i.componentDidMount=="function"&&(t.flags|=4194308)}function Ns(t,e){try{var n="",r=e;do n+=B_(r),r=r.return;while(r);var i=n}catch(s){i=`
Error generating stack: `+s.message+`
`+s.stack}return{value:t,source:e,stack:i,digest:null}}function Oc(t,e,n){return{value:t,source:null,stack:n??null,digest:e??null}}function Nd(t,e){try{console.error(e.value)}catch(n){setTimeout(function(){throw n})}}var mx=typeof WeakMap=="function"?WeakMap:Map;function My(t,e,n){n=Qn(-1,n),n.tag=3,n.payload={element:null};var r=e.value;return n.callback=function(){su||(su=!0,Bd=r),Nd(t,e)},n}function Ly(t,e,n){n=Qn(-1,n),n.tag=3;var r=t.type.getDerivedStateFromError;if(typeof r=="function"){var i=e.value;n.payload=function(){return r(i)},n.callback=function(){Nd(t,e)}}var s=t.stateNode;return s!==null&&typeof s.componentDidCatch=="function"&&(n.callback=function(){Nd(t,e),typeof r!="function"&&(Dr===null?Dr=new Set([this]):Dr.add(this));var o=e.stack;this.componentDidCatch(e.value,{componentStack:o!==null?o:""})}),n}function um(t,e,n){var r=t.pingCache;if(r===null){r=t.pingCache=new mx;var i=new Set;r.set(e,i)}else i=r.get(e),i===void 0&&(i=new Set,r.set(e,i));i.has(n)||(i.add(n),t=Cx.bind(null,t,e,n),e.then(t,t))}function cm(t){do{var e;if((e=t.tag===13)&&(e=t.memoizedState,e=e!==null?e.dehydrated!==null:!0),e)return t;t=t.return}while(t!==null);return null}function dm(t,e,n,r,i){return t.mode&1?(t.flags|=65536,t.lanes=i,t):(t===e?t.flags|=65536:(t.flags|=128,n.flags|=131072,n.flags&=-52805,n.tag===1&&(n.alternate===null?n.tag=17:(e=Qn(-1,1),e.tag=2,Vr(n,e,1))),n.lanes|=1),t)}var gx=ir.ReactCurrentOwner,Dt=!1;function kt(t,e,n,r){e.child=t===null?dy(e,null,n,r):Rs(e,t.child,n,r)}function hm(t,e,n,r,i){n=n.render;var s=e.ref;return ws(e,i),r=Jh(t,e,n,r,s,i),n=Zh(),t!==null&&!Dt?(e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~i,er(t,e,i)):(Ce&&n&&zh(e),e.flags|=1,kt(t,e,r,i),e.child)}function fm(t,e,n,r,i){if(t===null){var s=n.type;return typeof s=="function"&&!cf(s)&&s.defaultProps===void 0&&n.compare===null&&n.defaultProps===void 0?(e.tag=15,e.type=s,jy(t,e,s,r,i)):(t=Nl(n.type,null,r,e,e.mode,i),t.ref=e.ref,t.return=e,e.child=t)}if(s=t.child,!(t.lanes&i)){var o=s.memoizedProps;if(n=n.compare,n=n!==null?n:ea,n(o,r)&&t.ref===e.ref)return er(t,e,i)}return e.flags|=1,t=Lr(s,r),t.ref=e.ref,t.return=e,e.child=t}function jy(t,e,n,r,i){if(t!==null){var s=t.memoizedProps;if(ea(s,r)&&t.ref===e.ref)if(Dt=!1,e.pendingProps=r=s,(t.lanes&i)!==0)t.flags&131072&&(Dt=!0);else return e.lanes=t.lanes,er(t,e,i)}return Vd(t,e,n,r,i)}function Oy(t,e,n){var r=e.pendingProps,i=r.children,s=t!==null?t.memoizedState:null;if(r.mode==="hidden")if(!(e.mode&1))e.memoizedState={baseLanes:0,cachePool:null,transitions:null},be(ms,Ft),Ft|=n;else{if(!(n&1073741824))return t=s!==null?s.baseLanes|n:n,e.lanes=e.childLanes=1073741824,e.memoizedState={baseLanes:t,cachePool:null,transitions:null},e.updateQueue=null,be(ms,Ft),Ft|=t,null;e.memoizedState={baseLanes:0,cachePool:null,transitions:null},r=s!==null?s.baseLanes:n,be(ms,Ft),Ft|=r}else s!==null?(r=s.baseLanes|n,e.memoizedState=null):r=n,be(ms,Ft),Ft|=r;return kt(t,e,i,n),e.child}function Fy(t,e){var n=e.ref;(t===null&&n!==null||t!==null&&t.ref!==n)&&(e.flags|=512,e.flags|=2097152)}function Vd(t,e,n,r,i){var s=Lt(n)?Ii:Et.current;return s=As(e,s),ws(e,i),n=Jh(t,e,n,r,s,i),r=Zh(),t!==null&&!Dt?(e.updateQueue=t.updateQueue,e.flags&=-2053,t.lanes&=~i,er(t,e,i)):(Ce&&r&&zh(e),e.flags|=1,kt(t,e,n,i),e.child)}function pm(t,e,n,r,i){if(Lt(n)){var s=!0;Ql(e)}else s=!1;if(ws(e,i),e.stateNode===null)Cl(t,e),Dy(e,n,r),Pd(e,n,r,i),r=!0;else if(t===null){var o=e.stateNode,l=e.memoizedProps;o.props=l;var u=o.context,d=n.contextType;typeof d=="object"&&d!==null?d=an(d):(d=Lt(n)?Ii:Et.current,d=As(e,d));var p=n.getDerivedStateFromProps,m=typeof p=="function"||typeof o.getSnapshotBeforeUpdate=="function";m||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(l!==r||u!==d)&&lm(e,o,r,d),br=!1;var v=e.memoizedState;o.state=v,eu(e,r,o,i),u=e.memoizedState,l!==r||v!==u||Mt.current||br?(typeof p=="function"&&(Rd(e,n,p,r),u=e.memoizedState),(l=br||am(e,n,l,r,v,u,d))?(m||typeof o.UNSAFE_componentWillMount!="function"&&typeof o.componentWillMount!="function"||(typeof o.componentWillMount=="function"&&o.componentWillMount(),typeof o.UNSAFE_componentWillMount=="function"&&o.UNSAFE_componentWillMount()),typeof o.componentDidMount=="function"&&(e.flags|=4194308)):(typeof o.componentDidMount=="function"&&(e.flags|=4194308),e.memoizedProps=r,e.memoizedState=u),o.props=r,o.state=u,o.context=d,r=l):(typeof o.componentDidMount=="function"&&(e.flags|=4194308),r=!1)}else{o=e.stateNode,fy(t,e),l=e.memoizedProps,d=e.type===e.elementType?l:mn(e.type,l),o.props=d,m=e.pendingProps,v=o.context,u=n.contextType,typeof u=="object"&&u!==null?u=an(u):(u=Lt(n)?Ii:Et.current,u=As(e,u));var I=n.getDerivedStateFromProps;(p=typeof I=="function"||typeof o.getSnapshotBeforeUpdate=="function")||typeof o.UNSAFE_componentWillReceiveProps!="function"&&typeof o.componentWillReceiveProps!="function"||(l!==m||v!==u)&&lm(e,o,r,u),br=!1,v=e.memoizedState,o.state=v,eu(e,r,o,i);var A=e.memoizedState;l!==m||v!==A||Mt.current||br?(typeof I=="function"&&(Rd(e,n,I,r),A=e.memoizedState),(d=br||am(e,n,d,r,v,A,u)||!1)?(p||typeof o.UNSAFE_componentWillUpdate!="function"&&typeof o.componentWillUpdate!="function"||(typeof o.componentWillUpdate=="function"&&o.componentWillUpdate(r,A,u),typeof o.UNSAFE_componentWillUpdate=="function"&&o.UNSAFE_componentWillUpdate(r,A,u)),typeof o.componentDidUpdate=="function"&&(e.flags|=4),typeof o.getSnapshotBeforeUpdate=="function"&&(e.flags|=1024)):(typeof o.componentDidUpdate!="function"||l===t.memoizedProps&&v===t.memoizedState||(e.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||l===t.memoizedProps&&v===t.memoizedState||(e.flags|=1024),e.memoizedProps=r,e.memoizedState=A),o.props=r,o.state=A,o.context=u,r=d):(typeof o.componentDidUpdate!="function"||l===t.memoizedProps&&v===t.memoizedState||(e.flags|=4),typeof o.getSnapshotBeforeUpdate!="function"||l===t.memoizedProps&&v===t.memoizedState||(e.flags|=1024),r=!1)}return Dd(t,e,n,r,s,i)}function Dd(t,e,n,r,i,s){Fy(t,e);var o=(e.flags&128)!==0;if(!r&&!o)return i&&Zp(e,n,!1),er(t,e,s);r=e.stateNode,gx.current=e;var l=o&&typeof n.getDerivedStateFromError!="function"?null:r.render();return e.flags|=1,t!==null&&o?(e.child=Rs(e,t.child,null,s),e.child=Rs(e,null,l,s)):kt(t,e,l,s),e.memoizedState=r.state,i&&Zp(e,n,!0),e.child}function zy(t){var e=t.stateNode;e.pendingContext?Jp(t,e.pendingContext,e.pendingContext!==e.context):e.context&&Jp(t,e.context,!1),Kh(t,e.containerInfo)}function mm(t,e,n,r,i){return Cs(),Bh(i),e.flags|=256,kt(t,e,n,r),e.child}var Md={dehydrated:null,treeContext:null,retryLane:0};function Ld(t){return{baseLanes:t,cachePool:null,transitions:null}}function Uy(t,e,n){var r=e.pendingProps,i=Ne.current,s=!1,o=(e.flags&128)!==0,l;if((l=o)||(l=t!==null&&t.memoizedState===null?!1:(i&2)!==0),l?(s=!0,e.flags&=-129):(t===null||t.memoizedState!==null)&&(i|=1),be(Ne,i&1),t===null)return Ad(e),t=e.memoizedState,t!==null&&(t=t.dehydrated,t!==null)?(e.mode&1?t.data==="$!"?e.lanes=8:e.lanes=1073741824:e.lanes=1,null):(o=r.children,t=r.fallback,s?(r=e.mode,s=e.child,o={mode:"hidden",children:o},!(r&1)&&s!==null?(s.childLanes=0,s.pendingProps=o):s=Ou(o,r,0,null),t=ki(t,r,n,null),s.return=e,t.return=e,s.sibling=t,e.child=s,e.child.memoizedState=Ld(n),e.memoizedState=Md,t):nf(e,o));if(i=t.memoizedState,i!==null&&(l=i.dehydrated,l!==null))return yx(t,e,o,r,l,i,n);if(s){s=r.fallback,o=e.mode,i=t.child,l=i.sibling;var u={mode:"hidden",children:r.children};return!(o&1)&&e.child!==i?(r=e.child,r.childLanes=0,r.pendingProps=u,e.deletions=null):(r=Lr(i,u),r.subtreeFlags=i.subtreeFlags&14680064),l!==null?s=Lr(l,s):(s=ki(s,o,n,null),s.flags|=2),s.return=e,r.return=e,r.sibling=s,e.child=r,r=s,s=e.child,o=t.child.memoizedState,o=o===null?Ld(n):{baseLanes:o.baseLanes|n,cachePool:null,transitions:o.transitions},s.memoizedState=o,s.childLanes=t.childLanes&~n,e.memoizedState=Md,r}return s=t.child,t=s.sibling,r=Lr(s,{mode:"visible",children:r.children}),!(e.mode&1)&&(r.lanes=n),r.return=e,r.sibling=null,t!==null&&(n=e.deletions,n===null?(e.deletions=[t],e.flags|=16):n.push(t)),e.child=r,e.memoizedState=null,r}function nf(t,e){return e=Ou({mode:"visible",children:e},t.mode,0,null),e.return=t,t.child=e}function ll(t,e,n,r){return r!==null&&Bh(r),Rs(e,t.child,null,n),t=nf(e,e.pendingProps.children),t.flags|=2,e.memoizedState=null,t}function yx(t,e,n,r,i,s,o){if(n)return e.flags&256?(e.flags&=-257,r=Oc(Error(U(422))),ll(t,e,o,r)):e.memoizedState!==null?(e.child=t.child,e.flags|=128,null):(s=r.fallback,i=e.mode,r=Ou({mode:"visible",children:r.children},i,0,null),s=ki(s,i,o,null),s.flags|=2,r.return=e,s.return=e,r.sibling=s,e.child=r,e.mode&1&&Rs(e,t.child,null,o),e.child.memoizedState=Ld(o),e.memoizedState=Md,s);if(!(e.mode&1))return ll(t,e,o,null);if(i.data==="$!"){if(r=i.nextSibling&&i.nextSibling.dataset,r)var l=r.dgst;return r=l,s=Error(U(419)),r=Oc(s,r,void 0),ll(t,e,o,r)}if(l=(o&t.childLanes)!==0,Dt||l){if(r=lt,r!==null){switch(o&-o){case 4:i=2;break;case 16:i=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:i=32;break;case 536870912:i=268435456;break;default:i=0}i=i&(r.suspendedLanes|o)?0:i,i!==0&&i!==s.retryLane&&(s.retryLane=i,Zn(t,i),wn(r,t,i,-1))}return uf(),r=Oc(Error(U(421))),ll(t,e,o,r)}return i.data==="$?"?(e.flags|=128,e.child=t.child,e=Rx.bind(null,t),i._reactRetry=e,null):(t=s.treeContext,zt=Nr(i.nextSibling),Ut=e,Ce=!0,yn=null,t!==null&&(en[tn++]=Gn,en[tn++]=Kn,en[tn++]=Ai,Gn=t.id,Kn=t.overflow,Ai=e),e=nf(e,r.children),e.flags|=4096,e)}function gm(t,e,n){t.lanes|=e;var r=t.alternate;r!==null&&(r.lanes|=e),Cd(t.return,e,n)}function Fc(t,e,n,r,i){var s=t.memoizedState;s===null?t.memoizedState={isBackwards:e,rendering:null,renderingStartTime:0,last:r,tail:n,tailMode:i}:(s.isBackwards=e,s.rendering=null,s.renderingStartTime=0,s.last=r,s.tail=n,s.tailMode=i)}function By(t,e,n){var r=e.pendingProps,i=r.revealOrder,s=r.tail;if(kt(t,e,r.children,n),r=Ne.current,r&2)r=r&1|2,e.flags|=128;else{if(t!==null&&t.flags&128)e:for(t=e.child;t!==null;){if(t.tag===13)t.memoizedState!==null&&gm(t,n,e);else if(t.tag===19)gm(t,n,e);else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break e;for(;t.sibling===null;){if(t.return===null||t.return===e)break e;t=t.return}t.sibling.return=t.return,t=t.sibling}r&=1}if(be(Ne,r),!(e.mode&1))e.memoizedState=null;else switch(i){case"forwards":for(n=e.child,i=null;n!==null;)t=n.alternate,t!==null&&tu(t)===null&&(i=n),n=n.sibling;n=i,n===null?(i=e.child,e.child=null):(i=n.sibling,n.sibling=null),Fc(e,!1,i,n,s);break;case"backwards":for(n=null,i=e.child,e.child=null;i!==null;){if(t=i.alternate,t!==null&&tu(t)===null){e.child=i;break}t=i.sibling,i.sibling=n,n=i,i=t}Fc(e,!0,n,null,s);break;case"together":Fc(e,!1,null,null,void 0);break;default:e.memoizedState=null}return e.child}function Cl(t,e){!(e.mode&1)&&t!==null&&(t.alternate=null,e.alternate=null,e.flags|=2)}function er(t,e,n){if(t!==null&&(e.dependencies=t.dependencies),Ri|=e.lanes,!(n&e.childLanes))return null;if(t!==null&&e.child!==t.child)throw Error(U(153));if(e.child!==null){for(t=e.child,n=Lr(t,t.pendingProps),e.child=n,n.return=e;t.sibling!==null;)t=t.sibling,n=n.sibling=Lr(t,t.pendingProps),n.return=e;n.sibling=null}return e.child}function vx(t,e,n){switch(e.tag){case 3:zy(e),Cs();break;case 5:py(e);break;case 1:Lt(e.type)&&Ql(e);break;case 4:Kh(e,e.stateNode.containerInfo);break;case 10:var r=e.type._context,i=e.memoizedProps.value;be(Jl,r._currentValue),r._currentValue=i;break;case 13:if(r=e.memoizedState,r!==null)return r.dehydrated!==null?(be(Ne,Ne.current&1),e.flags|=128,null):n&e.child.childLanes?Uy(t,e,n):(be(Ne,Ne.current&1),t=er(t,e,n),t!==null?t.sibling:null);be(Ne,Ne.current&1);break;case 19:if(r=(n&e.childLanes)!==0,t.flags&128){if(r)return By(t,e,n);e.flags|=128}if(i=e.memoizedState,i!==null&&(i.rendering=null,i.tail=null,i.lastEffect=null),be(Ne,Ne.current),r)break;return null;case 22:case 23:return e.lanes=0,Oy(t,e,n)}return er(t,e,n)}var $y,jd,qy,Hy;$y=function(t,e){for(var n=e.child;n!==null;){if(n.tag===5||n.tag===6)t.appendChild(n.stateNode);else if(n.tag!==4&&n.child!==null){n.child.return=n,n=n.child;continue}if(n===e)break;for(;n.sibling===null;){if(n.return===null||n.return===e)return;n=n.return}n.sibling.return=n.return,n=n.sibling}};jd=function(){};qy=function(t,e,n,r){var i=t.memoizedProps;if(i!==r){t=e.stateNode,Ei(Ln.current);var s=null;switch(n){case"input":i=sd(t,i),r=sd(t,r),s=[];break;case"select":i=De({},i,{value:void 0}),r=De({},r,{value:void 0}),s=[];break;case"textarea":i=ld(t,i),r=ld(t,r),s=[];break;default:typeof i.onClick!="function"&&typeof r.onClick=="function"&&(t.onclick=Gl)}cd(n,r);var o;n=null;for(d in i)if(!r.hasOwnProperty(d)&&i.hasOwnProperty(d)&&i[d]!=null)if(d==="style"){var l=i[d];for(o in l)l.hasOwnProperty(o)&&(n||(n={}),n[o]="")}else d!=="dangerouslySetInnerHTML"&&d!=="children"&&d!=="suppressContentEditableWarning"&&d!=="suppressHydrationWarning"&&d!=="autoFocus"&&(Go.hasOwnProperty(d)?s||(s=[]):(s=s||[]).push(d,null));for(d in r){var u=r[d];if(l=i!=null?i[d]:void 0,r.hasOwnProperty(d)&&u!==l&&(u!=null||l!=null))if(d==="style")if(l){for(o in l)!l.hasOwnProperty(o)||u&&u.hasOwnProperty(o)||(n||(n={}),n[o]="");for(o in u)u.hasOwnProperty(o)&&l[o]!==u[o]&&(n||(n={}),n[o]=u[o])}else n||(s||(s=[]),s.push(d,n)),n=u;else d==="dangerouslySetInnerHTML"?(u=u?u.__html:void 0,l=l?l.__html:void 0,u!=null&&l!==u&&(s=s||[]).push(d,u)):d==="children"?typeof u!="string"&&typeof u!="number"||(s=s||[]).push(d,""+u):d!=="suppressContentEditableWarning"&&d!=="suppressHydrationWarning"&&(Go.hasOwnProperty(d)?(u!=null&&d==="onScroll"&&Se("scroll",t),s||l===u||(s=[])):(s=s||[]).push(d,u))}n&&(s=s||[]).push("style",n);var d=s;(e.updateQueue=d)&&(e.flags|=4)}};Hy=function(t,e,n,r){n!==r&&(e.flags|=4)};function wo(t,e){if(!Ce)switch(t.tailMode){case"hidden":e=t.tail;for(var n=null;e!==null;)e.alternate!==null&&(n=e),e=e.sibling;n===null?t.tail=null:n.sibling=null;break;case"collapsed":n=t.tail;for(var r=null;n!==null;)n.alternate!==null&&(r=n),n=n.sibling;r===null?e||t.tail===null?t.tail=null:t.tail.sibling=null:r.sibling=null}}function yt(t){var e=t.alternate!==null&&t.alternate.child===t.child,n=0,r=0;if(e)for(var i=t.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags&14680064,r|=i.flags&14680064,i.return=t,i=i.sibling;else for(i=t.child;i!==null;)n|=i.lanes|i.childLanes,r|=i.subtreeFlags,r|=i.flags,i.return=t,i=i.sibling;return t.subtreeFlags|=r,t.childLanes=n,e}function _x(t,e,n){var r=e.pendingProps;switch(Uh(e),e.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return yt(e),null;case 1:return Lt(e.type)&&Kl(),yt(e),null;case 3:return r=e.stateNode,Ps(),Ie(Mt),Ie(Et),Yh(),r.pendingContext&&(r.context=r.pendingContext,r.pendingContext=null),(t===null||t.child===null)&&(ol(e)?e.flags|=4:t===null||t.memoizedState.isDehydrated&&!(e.flags&256)||(e.flags|=1024,yn!==null&&(Hd(yn),yn=null))),jd(t,e),yt(e),null;case 5:Qh(e);var i=Ei(sa.current);if(n=e.type,t!==null&&e.stateNode!=null)qy(t,e,n,r,i),t.ref!==e.ref&&(e.flags|=512,e.flags|=2097152);else{if(!r){if(e.stateNode===null)throw Error(U(166));return yt(e),null}if(t=Ei(Ln.current),ol(e)){r=e.stateNode,n=e.type;var s=e.memoizedProps;switch(r[Vn]=e,r[ra]=s,t=(e.mode&1)!==0,n){case"dialog":Se("cancel",r),Se("close",r);break;case"iframe":case"object":case"embed":Se("load",r);break;case"video":case"audio":for(i=0;i<Ao.length;i++)Se(Ao[i],r);break;case"source":Se("error",r);break;case"img":case"image":case"link":Se("error",r),Se("load",r);break;case"details":Se("toggle",r);break;case"input":Sp(r,s),Se("invalid",r);break;case"select":r._wrapperState={wasMultiple:!!s.multiple},Se("invalid",r);break;case"textarea":Ip(r,s),Se("invalid",r)}cd(n,s),i=null;for(var o in s)if(s.hasOwnProperty(o)){var l=s[o];o==="children"?typeof l=="string"?r.textContent!==l&&(s.suppressHydrationWarning!==!0&&sl(r.textContent,l,t),i=["children",l]):typeof l=="number"&&r.textContent!==""+l&&(s.suppressHydrationWarning!==!0&&sl(r.textContent,l,t),i=["children",""+l]):Go.hasOwnProperty(o)&&l!=null&&o==="onScroll"&&Se("scroll",r)}switch(n){case"input":Xa(r),kp(r,s,!0);break;case"textarea":Xa(r),Ap(r);break;case"select":case"option":break;default:typeof s.onClick=="function"&&(r.onclick=Gl)}r=i,e.updateQueue=r,r!==null&&(e.flags|=4)}else{o=i.nodeType===9?i:i.ownerDocument,t==="http://www.w3.org/1999/xhtml"&&(t=_0(n)),t==="http://www.w3.org/1999/xhtml"?n==="script"?(t=o.createElement("div"),t.innerHTML="<script><\/script>",t=t.removeChild(t.firstChild)):typeof r.is=="string"?t=o.createElement(n,{is:r.is}):(t=o.createElement(n),n==="select"&&(o=t,r.multiple?o.multiple=!0:r.size&&(o.size=r.size))):t=o.createElementNS(t,n),t[Vn]=e,t[ra]=r,$y(t,e,!1,!1),e.stateNode=t;e:{switch(o=dd(n,r),n){case"dialog":Se("cancel",t),Se("close",t),i=r;break;case"iframe":case"object":case"embed":Se("load",t),i=r;break;case"video":case"audio":for(i=0;i<Ao.length;i++)Se(Ao[i],t);i=r;break;case"source":Se("error",t),i=r;break;case"img":case"image":case"link":Se("error",t),Se("load",t),i=r;break;case"details":Se("toggle",t),i=r;break;case"input":Sp(t,r),i=sd(t,r),Se("invalid",t);break;case"option":i=r;break;case"select":t._wrapperState={wasMultiple:!!r.multiple},i=De({},r,{value:void 0}),Se("invalid",t);break;case"textarea":Ip(t,r),i=ld(t,r),Se("invalid",t);break;default:i=r}cd(n,i),l=i;for(s in l)if(l.hasOwnProperty(s)){var u=l[s];s==="style"?E0(t,u):s==="dangerouslySetInnerHTML"?(u=u?u.__html:void 0,u!=null&&w0(t,u)):s==="children"?typeof u=="string"?(n!=="textarea"||u!=="")&&Ko(t,u):typeof u=="number"&&Ko(t,""+u):s!=="suppressContentEditableWarning"&&s!=="suppressHydrationWarning"&&s!=="autoFocus"&&(Go.hasOwnProperty(s)?u!=null&&s==="onScroll"&&Se("scroll",t):u!=null&&kh(t,s,u,o))}switch(n){case"input":Xa(t),kp(t,r,!1);break;case"textarea":Xa(t),Ap(t);break;case"option":r.value!=null&&t.setAttribute("value",""+Br(r.value));break;case"select":t.multiple=!!r.multiple,s=r.value,s!=null?gs(t,!!r.multiple,s,!1):r.defaultValue!=null&&gs(t,!!r.multiple,r.defaultValue,!0);break;default:typeof i.onClick=="function"&&(t.onclick=Gl)}switch(n){case"button":case"input":case"select":case"textarea":r=!!r.autoFocus;break e;case"img":r=!0;break e;default:r=!1}}r&&(e.flags|=4)}e.ref!==null&&(e.flags|=512,e.flags|=2097152)}return yt(e),null;case 6:if(t&&e.stateNode!=null)Hy(t,e,t.memoizedProps,r);else{if(typeof r!="string"&&e.stateNode===null)throw Error(U(166));if(n=Ei(sa.current),Ei(Ln.current),ol(e)){if(r=e.stateNode,n=e.memoizedProps,r[Vn]=e,(s=r.nodeValue!==n)&&(t=Ut,t!==null))switch(t.tag){case 3:sl(r.nodeValue,n,(t.mode&1)!==0);break;case 5:t.memoizedProps.suppressHydrationWarning!==!0&&sl(r.nodeValue,n,(t.mode&1)!==0)}s&&(e.flags|=4)}else r=(n.nodeType===9?n:n.ownerDocument).createTextNode(r),r[Vn]=e,e.stateNode=r}return yt(e),null;case 13:if(Ie(Ne),r=e.memoizedState,t===null||t.memoizedState!==null&&t.memoizedState.dehydrated!==null){if(Ce&&zt!==null&&e.mode&1&&!(e.flags&128))uy(),Cs(),e.flags|=98560,s=!1;else if(s=ol(e),r!==null&&r.dehydrated!==null){if(t===null){if(!s)throw Error(U(318));if(s=e.memoizedState,s=s!==null?s.dehydrated:null,!s)throw Error(U(317));s[Vn]=e}else Cs(),!(e.flags&128)&&(e.memoizedState=null),e.flags|=4;yt(e),s=!1}else yn!==null&&(Hd(yn),yn=null),s=!0;if(!s)return e.flags&65536?e:null}return e.flags&128?(e.lanes=n,e):(r=r!==null,r!==(t!==null&&t.memoizedState!==null)&&r&&(e.child.flags|=8192,e.mode&1&&(t===null||Ne.current&1?Je===0&&(Je=3):uf())),e.updateQueue!==null&&(e.flags|=4),yt(e),null);case 4:return Ps(),jd(t,e),t===null&&ta(e.stateNode.containerInfo),yt(e),null;case 10:return Hh(e.type._context),yt(e),null;case 17:return Lt(e.type)&&Kl(),yt(e),null;case 19:if(Ie(Ne),s=e.memoizedState,s===null)return yt(e),null;if(r=(e.flags&128)!==0,o=s.rendering,o===null)if(r)wo(s,!1);else{if(Je!==0||t!==null&&t.flags&128)for(t=e.child;t!==null;){if(o=tu(t),o!==null){for(e.flags|=128,wo(s,!1),r=o.updateQueue,r!==null&&(e.updateQueue=r,e.flags|=4),e.subtreeFlags=0,r=n,n=e.child;n!==null;)s=n,t=r,s.flags&=14680066,o=s.alternate,o===null?(s.childLanes=0,s.lanes=t,s.child=null,s.subtreeFlags=0,s.memoizedProps=null,s.memoizedState=null,s.updateQueue=null,s.dependencies=null,s.stateNode=null):(s.childLanes=o.childLanes,s.lanes=o.lanes,s.child=o.child,s.subtreeFlags=0,s.deletions=null,s.memoizedProps=o.memoizedProps,s.memoizedState=o.memoizedState,s.updateQueue=o.updateQueue,s.type=o.type,t=o.dependencies,s.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),n=n.sibling;return be(Ne,Ne.current&1|2),e.child}t=t.sibling}s.tail!==null&&Be()>Vs&&(e.flags|=128,r=!0,wo(s,!1),e.lanes=4194304)}else{if(!r)if(t=tu(o),t!==null){if(e.flags|=128,r=!0,n=t.updateQueue,n!==null&&(e.updateQueue=n,e.flags|=4),wo(s,!0),s.tail===null&&s.tailMode==="hidden"&&!o.alternate&&!Ce)return yt(e),null}else 2*Be()-s.renderingStartTime>Vs&&n!==1073741824&&(e.flags|=128,r=!0,wo(s,!1),e.lanes=4194304);s.isBackwards?(o.sibling=e.child,e.child=o):(n=s.last,n!==null?n.sibling=o:e.child=o,s.last=o)}return s.tail!==null?(e=s.tail,s.rendering=e,s.tail=e.sibling,s.renderingStartTime=Be(),e.sibling=null,n=Ne.current,be(Ne,r?n&1|2:n&1),e):(yt(e),null);case 22:case 23:return lf(),r=e.memoizedState!==null,t!==null&&t.memoizedState!==null!==r&&(e.flags|=8192),r&&e.mode&1?Ft&1073741824&&(yt(e),e.subtreeFlags&6&&(e.flags|=8192)):yt(e),null;case 24:return null;case 25:return null}throw Error(U(156,e.tag))}function wx(t,e){switch(Uh(e),e.tag){case 1:return Lt(e.type)&&Kl(),t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 3:return Ps(),Ie(Mt),Ie(Et),Yh(),t=e.flags,t&65536&&!(t&128)?(e.flags=t&-65537|128,e):null;case 5:return Qh(e),null;case 13:if(Ie(Ne),t=e.memoizedState,t!==null&&t.dehydrated!==null){if(e.alternate===null)throw Error(U(340));Cs()}return t=e.flags,t&65536?(e.flags=t&-65537|128,e):null;case 19:return Ie(Ne),null;case 4:return Ps(),null;case 10:return Hh(e.type._context),null;case 22:case 23:return lf(),null;case 24:return null;default:return null}}var ul=!1,wt=!1,xx=typeof WeakSet=="function"?WeakSet:Set,Q=null;function ps(t,e){var n=t.ref;if(n!==null)if(typeof n=="function")try{n(null)}catch(r){Fe(t,e,r)}else n.current=null}function Od(t,e,n){try{n()}catch(r){Fe(t,e,r)}}var ym=!1;function Ex(t,e){if(xd=ql,t=Y0(),Fh(t)){if("selectionStart"in t)var n={start:t.selectionStart,end:t.selectionEnd};else e:{n=(n=t.ownerDocument)&&n.defaultView||window;var r=n.getSelection&&n.getSelection();if(r&&r.rangeCount!==0){n=r.anchorNode;var i=r.anchorOffset,s=r.focusNode;r=r.focusOffset;try{n.nodeType,s.nodeType}catch{n=null;break e}var o=0,l=-1,u=-1,d=0,p=0,m=t,v=null;t:for(;;){for(var I;m!==n||i!==0&&m.nodeType!==3||(l=o+i),m!==s||r!==0&&m.nodeType!==3||(u=o+r),m.nodeType===3&&(o+=m.nodeValue.length),(I=m.firstChild)!==null;)v=m,m=I;for(;;){if(m===t)break t;if(v===n&&++d===i&&(l=o),v===s&&++p===r&&(u=o),(I=m.nextSibling)!==null)break;m=v,v=m.parentNode}m=I}n=l===-1||u===-1?null:{start:l,end:u}}else n=null}n=n||{start:0,end:0}}else n=null;for(Ed={focusedElem:t,selectionRange:n},ql=!1,Q=e;Q!==null;)if(e=Q,t=e.child,(e.subtreeFlags&1028)!==0&&t!==null)t.return=e,Q=t;else for(;Q!==null;){e=Q;try{var A=e.alternate;if(e.flags&1024)switch(e.tag){case 0:case 11:case 15:break;case 1:if(A!==null){var P=A.memoizedProps,M=A.memoizedState,S=e.stateNode,x=S.getSnapshotBeforeUpdate(e.elementType===e.type?P:mn(e.type,P),M);S.__reactInternalSnapshotBeforeUpdate=x}break;case 3:var k=e.stateNode.containerInfo;k.nodeType===1?k.textContent="":k.nodeType===9&&k.documentElement&&k.removeChild(k.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(U(163))}}catch(V){Fe(e,e.return,V)}if(t=e.sibling,t!==null){t.return=e.return,Q=t;break}Q=e.return}return A=ym,ym=!1,A}function Fo(t,e,n){var r=e.updateQueue;if(r=r!==null?r.lastEffect:null,r!==null){var i=r=r.next;do{if((i.tag&t)===t){var s=i.destroy;i.destroy=void 0,s!==void 0&&Od(e,n,s)}i=i.next}while(i!==r)}}function Lu(t,e){if(e=e.updateQueue,e=e!==null?e.lastEffect:null,e!==null){var n=e=e.next;do{if((n.tag&t)===t){var r=n.create;n.destroy=r()}n=n.next}while(n!==e)}}function Fd(t){var e=t.ref;if(e!==null){var n=t.stateNode;switch(t.tag){case 5:t=n;break;default:t=n}typeof e=="function"?e(t):e.current=t}}function Wy(t){var e=t.alternate;e!==null&&(t.alternate=null,Wy(e)),t.child=null,t.deletions=null,t.sibling=null,t.tag===5&&(e=t.stateNode,e!==null&&(delete e[Vn],delete e[ra],delete e[Sd],delete e[ix],delete e[sx])),t.stateNode=null,t.return=null,t.dependencies=null,t.memoizedProps=null,t.memoizedState=null,t.pendingProps=null,t.stateNode=null,t.updateQueue=null}function Gy(t){return t.tag===5||t.tag===3||t.tag===4}function vm(t){e:for(;;){for(;t.sibling===null;){if(t.return===null||Gy(t.return))return null;t=t.return}for(t.sibling.return=t.return,t=t.sibling;t.tag!==5&&t.tag!==6&&t.tag!==18;){if(t.flags&2||t.child===null||t.tag===4)continue e;t.child.return=t,t=t.child}if(!(t.flags&2))return t.stateNode}}function zd(t,e,n){var r=t.tag;if(r===5||r===6)t=t.stateNode,e?n.nodeType===8?n.parentNode.insertBefore(t,e):n.insertBefore(t,e):(n.nodeType===8?(e=n.parentNode,e.insertBefore(t,n)):(e=n,e.appendChild(t)),n=n._reactRootContainer,n!=null||e.onclick!==null||(e.onclick=Gl));else if(r!==4&&(t=t.child,t!==null))for(zd(t,e,n),t=t.sibling;t!==null;)zd(t,e,n),t=t.sibling}function Ud(t,e,n){var r=t.tag;if(r===5||r===6)t=t.stateNode,e?n.insertBefore(t,e):n.appendChild(t);else if(r!==4&&(t=t.child,t!==null))for(Ud(t,e,n),t=t.sibling;t!==null;)Ud(t,e,n),t=t.sibling}var ct=null,gn=!1;function wr(t,e,n){for(n=n.child;n!==null;)Ky(t,e,n),n=n.sibling}function Ky(t,e,n){if(Mn&&typeof Mn.onCommitFiberUnmount=="function")try{Mn.onCommitFiberUnmount(Au,n)}catch{}switch(n.tag){case 5:wt||ps(n,e);case 6:var r=ct,i=gn;ct=null,wr(t,e,n),ct=r,gn=i,ct!==null&&(gn?(t=ct,n=n.stateNode,t.nodeType===8?t.parentNode.removeChild(n):t.removeChild(n)):ct.removeChild(n.stateNode));break;case 18:ct!==null&&(gn?(t=ct,n=n.stateNode,t.nodeType===8?Nc(t.parentNode,n):t.nodeType===1&&Nc(t,n),Jo(t)):Nc(ct,n.stateNode));break;case 4:r=ct,i=gn,ct=n.stateNode.containerInfo,gn=!0,wr(t,e,n),ct=r,gn=i;break;case 0:case 11:case 14:case 15:if(!wt&&(r=n.updateQueue,r!==null&&(r=r.lastEffect,r!==null))){i=r=r.next;do{var s=i,o=s.destroy;s=s.tag,o!==void 0&&(s&2||s&4)&&Od(n,e,o),i=i.next}while(i!==r)}wr(t,e,n);break;case 1:if(!wt&&(ps(n,e),r=n.stateNode,typeof r.componentWillUnmount=="function"))try{r.props=n.memoizedProps,r.state=n.memoizedState,r.componentWillUnmount()}catch(l){Fe(n,e,l)}wr(t,e,n);break;case 21:wr(t,e,n);break;case 22:n.mode&1?(wt=(r=wt)||n.memoizedState!==null,wr(t,e,n),wt=r):wr(t,e,n);break;default:wr(t,e,n)}}function _m(t){var e=t.updateQueue;if(e!==null){t.updateQueue=null;var n=t.stateNode;n===null&&(n=t.stateNode=new xx),e.forEach(function(r){var i=Px.bind(null,t,r);n.has(r)||(n.add(r),r.then(i,i))})}}function pn(t,e){var n=e.deletions;if(n!==null)for(var r=0;r<n.length;r++){var i=n[r];try{var s=t,o=e,l=o;e:for(;l!==null;){switch(l.tag){case 5:ct=l.stateNode,gn=!1;break e;case 3:ct=l.stateNode.containerInfo,gn=!0;break e;case 4:ct=l.stateNode.containerInfo,gn=!0;break e}l=l.return}if(ct===null)throw Error(U(160));Ky(s,o,i),ct=null,gn=!1;var u=i.alternate;u!==null&&(u.return=null),i.return=null}catch(d){Fe(i,e,d)}}if(e.subtreeFlags&12854)for(e=e.child;e!==null;)Qy(e,t),e=e.sibling}function Qy(t,e){var n=t.alternate,r=t.flags;switch(t.tag){case 0:case 11:case 14:case 15:if(pn(e,t),Rn(t),r&4){try{Fo(3,t,t.return),Lu(3,t)}catch(P){Fe(t,t.return,P)}try{Fo(5,t,t.return)}catch(P){Fe(t,t.return,P)}}break;case 1:pn(e,t),Rn(t),r&512&&n!==null&&ps(n,n.return);break;case 5:if(pn(e,t),Rn(t),r&512&&n!==null&&ps(n,n.return),t.flags&32){var i=t.stateNode;try{Ko(i,"")}catch(P){Fe(t,t.return,P)}}if(r&4&&(i=t.stateNode,i!=null)){var s=t.memoizedProps,o=n!==null?n.memoizedProps:s,l=t.type,u=t.updateQueue;if(t.updateQueue=null,u!==null)try{l==="input"&&s.type==="radio"&&s.name!=null&&y0(i,s),dd(l,o);var d=dd(l,s);for(o=0;o<u.length;o+=2){var p=u[o],m=u[o+1];p==="style"?E0(i,m):p==="dangerouslySetInnerHTML"?w0(i,m):p==="children"?Ko(i,m):kh(i,p,m,d)}switch(l){case"input":od(i,s);break;case"textarea":v0(i,s);break;case"select":var v=i._wrapperState.wasMultiple;i._wrapperState.wasMultiple=!!s.multiple;var I=s.value;I!=null?gs(i,!!s.multiple,I,!1):v!==!!s.multiple&&(s.defaultValue!=null?gs(i,!!s.multiple,s.defaultValue,!0):gs(i,!!s.multiple,s.multiple?[]:"",!1))}i[ra]=s}catch(P){Fe(t,t.return,P)}}break;case 6:if(pn(e,t),Rn(t),r&4){if(t.stateNode===null)throw Error(U(162));i=t.stateNode,s=t.memoizedProps;try{i.nodeValue=s}catch(P){Fe(t,t.return,P)}}break;case 3:if(pn(e,t),Rn(t),r&4&&n!==null&&n.memoizedState.isDehydrated)try{Jo(e.containerInfo)}catch(P){Fe(t,t.return,P)}break;case 4:pn(e,t),Rn(t);break;case 13:pn(e,t),Rn(t),i=t.child,i.flags&8192&&(s=i.memoizedState!==null,i.stateNode.isHidden=s,!s||i.alternate!==null&&i.alternate.memoizedState!==null||(of=Be())),r&4&&_m(t);break;case 22:if(p=n!==null&&n.memoizedState!==null,t.mode&1?(wt=(d=wt)||p,pn(e,t),wt=d):pn(e,t),Rn(t),r&8192){if(d=t.memoizedState!==null,(t.stateNode.isHidden=d)&&!p&&t.mode&1)for(Q=t,p=t.child;p!==null;){for(m=Q=p;Q!==null;){switch(v=Q,I=v.child,v.tag){case 0:case 11:case 14:case 15:Fo(4,v,v.return);break;case 1:ps(v,v.return);var A=v.stateNode;if(typeof A.componentWillUnmount=="function"){r=v,n=v.return;try{e=r,A.props=e.memoizedProps,A.state=e.memoizedState,A.componentWillUnmount()}catch(P){Fe(r,n,P)}}break;case 5:ps(v,v.return);break;case 22:if(v.memoizedState!==null){xm(m);continue}}I!==null?(I.return=v,Q=I):xm(m)}p=p.sibling}e:for(p=null,m=t;;){if(m.tag===5){if(p===null){p=m;try{i=m.stateNode,d?(s=i.style,typeof s.setProperty=="function"?s.setProperty("display","none","important"):s.display="none"):(l=m.stateNode,u=m.memoizedProps.style,o=u!=null&&u.hasOwnProperty("display")?u.display:null,l.style.display=x0("display",o))}catch(P){Fe(t,t.return,P)}}}else if(m.tag===6){if(p===null)try{m.stateNode.nodeValue=d?"":m.memoizedProps}catch(P){Fe(t,t.return,P)}}else if((m.tag!==22&&m.tag!==23||m.memoizedState===null||m===t)&&m.child!==null){m.child.return=m,m=m.child;continue}if(m===t)break e;for(;m.sibling===null;){if(m.return===null||m.return===t)break e;p===m&&(p=null),m=m.return}p===m&&(p=null),m.sibling.return=m.return,m=m.sibling}}break;case 19:pn(e,t),Rn(t),r&4&&_m(t);break;case 21:break;default:pn(e,t),Rn(t)}}function Rn(t){var e=t.flags;if(e&2){try{e:{for(var n=t.return;n!==null;){if(Gy(n)){var r=n;break e}n=n.return}throw Error(U(160))}switch(r.tag){case 5:var i=r.stateNode;r.flags&32&&(Ko(i,""),r.flags&=-33);var s=vm(t);Ud(t,s,i);break;case 3:case 4:var o=r.stateNode.containerInfo,l=vm(t);zd(t,l,o);break;default:throw Error(U(161))}}catch(u){Fe(t,t.return,u)}t.flags&=-3}e&4096&&(t.flags&=-4097)}function bx(t,e,n){Q=t,Yy(t)}function Yy(t,e,n){for(var r=(t.mode&1)!==0;Q!==null;){var i=Q,s=i.child;if(i.tag===22&&r){var o=i.memoizedState!==null||ul;if(!o){var l=i.alternate,u=l!==null&&l.memoizedState!==null||wt;l=ul;var d=wt;if(ul=o,(wt=u)&&!d)for(Q=i;Q!==null;)o=Q,u=o.child,o.tag===22&&o.memoizedState!==null?Em(i):u!==null?(u.return=o,Q=u):Em(i);for(;s!==null;)Q=s,Yy(s),s=s.sibling;Q=i,ul=l,wt=d}wm(t)}else i.subtreeFlags&8772&&s!==null?(s.return=i,Q=s):wm(t)}}function wm(t){for(;Q!==null;){var e=Q;if(e.flags&8772){var n=e.alternate;try{if(e.flags&8772)switch(e.tag){case 0:case 11:case 15:wt||Lu(5,e);break;case 1:var r=e.stateNode;if(e.flags&4&&!wt)if(n===null)r.componentDidMount();else{var i=e.elementType===e.type?n.memoizedProps:mn(e.type,n.memoizedProps);r.componentDidUpdate(i,n.memoizedState,r.__reactInternalSnapshotBeforeUpdate)}var s=e.updateQueue;s!==null&&im(e,s,r);break;case 3:var o=e.updateQueue;if(o!==null){if(n=null,e.child!==null)switch(e.child.tag){case 5:n=e.child.stateNode;break;case 1:n=e.child.stateNode}im(e,o,n)}break;case 5:var l=e.stateNode;if(n===null&&e.flags&4){n=l;var u=e.memoizedProps;switch(e.type){case"button":case"input":case"select":case"textarea":u.autoFocus&&n.focus();break;case"img":u.src&&(n.src=u.src)}}break;case 6:break;case 4:break;case 12:break;case 13:if(e.memoizedState===null){var d=e.alternate;if(d!==null){var p=d.memoizedState;if(p!==null){var m=p.dehydrated;m!==null&&Jo(m)}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;default:throw Error(U(163))}wt||e.flags&512&&Fd(e)}catch(v){Fe(e,e.return,v)}}if(e===t){Q=null;break}if(n=e.sibling,n!==null){n.return=e.return,Q=n;break}Q=e.return}}function xm(t){for(;Q!==null;){var e=Q;if(e===t){Q=null;break}var n=e.sibling;if(n!==null){n.return=e.return,Q=n;break}Q=e.return}}function Em(t){for(;Q!==null;){var e=Q;try{switch(e.tag){case 0:case 11:case 15:var n=e.return;try{Lu(4,e)}catch(u){Fe(e,n,u)}break;case 1:var r=e.stateNode;if(typeof r.componentDidMount=="function"){var i=e.return;try{r.componentDidMount()}catch(u){Fe(e,i,u)}}var s=e.return;try{Fd(e)}catch(u){Fe(e,s,u)}break;case 5:var o=e.return;try{Fd(e)}catch(u){Fe(e,o,u)}}}catch(u){Fe(e,e.return,u)}if(e===t){Q=null;break}var l=e.sibling;if(l!==null){l.return=e.return,Q=l;break}Q=e.return}}var Tx=Math.ceil,iu=ir.ReactCurrentDispatcher,rf=ir.ReactCurrentOwner,on=ir.ReactCurrentBatchConfig,ge=0,lt=null,He=null,ft=0,Ft=0,ms=Xr(0),Je=0,ua=null,Ri=0,ju=0,sf=0,zo=null,Vt=null,of=0,Vs=1/0,Hn=null,su=!1,Bd=null,Dr=null,cl=!1,Ir=null,ou=0,Uo=0,$d=null,Rl=-1,Pl=0;function It(){return ge&6?Be():Rl!==-1?Rl:Rl=Be()}function Mr(t){return t.mode&1?ge&2&&ft!==0?ft&-ft:ax.transition!==null?(Pl===0&&(Pl=D0()),Pl):(t=_e,t!==0||(t=window.event,t=t===void 0?16:U0(t.type)),t):1}function wn(t,e,n,r){if(50<Uo)throw Uo=0,$d=null,Error(U(185));ba(t,n,r),(!(ge&2)||t!==lt)&&(t===lt&&(!(ge&2)&&(ju|=n),Je===4&&Sr(t,ft)),jt(t,r),n===1&&ge===0&&!(e.mode&1)&&(Vs=Be()+500,Vu&&Jr()))}function jt(t,e){var n=t.callbackNode;aw(t,e);var r=$l(t,t===lt?ft:0);if(r===0)n!==null&&Pp(n),t.callbackNode=null,t.callbackPriority=0;else if(e=r&-r,t.callbackPriority!==e){if(n!=null&&Pp(n),e===1)t.tag===0?ox(bm.bind(null,t)):oy(bm.bind(null,t)),nx(function(){!(ge&6)&&Jr()}),n=null;else{switch(M0(r)){case 1:n=Ph;break;case 4:n=N0;break;case 16:n=Bl;break;case 536870912:n=V0;break;default:n=Bl}n=iv(n,Xy.bind(null,t))}t.callbackPriority=e,t.callbackNode=n}}function Xy(t,e){if(Rl=-1,Pl=0,ge&6)throw Error(U(327));var n=t.callbackNode;if(xs()&&t.callbackNode!==n)return null;var r=$l(t,t===lt?ft:0);if(r===0)return null;if(r&30||r&t.expiredLanes||e)e=au(t,r);else{e=r;var i=ge;ge|=2;var s=Zy();(lt!==t||ft!==e)&&(Hn=null,Vs=Be()+500,Si(t,e));do try{Ix();break}catch(l){Jy(t,l)}while(!0);qh(),iu.current=s,ge=i,He!==null?e=0:(lt=null,ft=0,e=Je)}if(e!==0){if(e===2&&(i=gd(t),i!==0&&(r=i,e=qd(t,i))),e===1)throw n=ua,Si(t,0),Sr(t,r),jt(t,Be()),n;if(e===6)Sr(t,r);else{if(i=t.current.alternate,!(r&30)&&!Sx(i)&&(e=au(t,r),e===2&&(s=gd(t),s!==0&&(r=s,e=qd(t,s))),e===1))throw n=ua,Si(t,0),Sr(t,r),jt(t,Be()),n;switch(t.finishedWork=i,t.finishedLanes=r,e){case 0:case 1:throw Error(U(345));case 2:vi(t,Vt,Hn);break;case 3:if(Sr(t,r),(r&130023424)===r&&(e=of+500-Be(),10<e)){if($l(t,0)!==0)break;if(i=t.suspendedLanes,(i&r)!==r){It(),t.pingedLanes|=t.suspendedLanes&i;break}t.timeoutHandle=Td(vi.bind(null,t,Vt,Hn),e);break}vi(t,Vt,Hn);break;case 4:if(Sr(t,r),(r&4194240)===r)break;for(e=t.eventTimes,i=-1;0<r;){var o=31-_n(r);s=1<<o,o=e[o],o>i&&(i=o),r&=~s}if(r=i,r=Be()-r,r=(120>r?120:480>r?480:1080>r?1080:1920>r?1920:3e3>r?3e3:4320>r?4320:1960*Tx(r/1960))-r,10<r){t.timeoutHandle=Td(vi.bind(null,t,Vt,Hn),r);break}vi(t,Vt,Hn);break;case 5:vi(t,Vt,Hn);break;default:throw Error(U(329))}}}return jt(t,Be()),t.callbackNode===n?Xy.bind(null,t):null}function qd(t,e){var n=zo;return t.current.memoizedState.isDehydrated&&(Si(t,e).flags|=256),t=au(t,e),t!==2&&(e=Vt,Vt=n,e!==null&&Hd(e)),t}function Hd(t){Vt===null?Vt=t:Vt.push.apply(Vt,t)}function Sx(t){for(var e=t;;){if(e.flags&16384){var n=e.updateQueue;if(n!==null&&(n=n.stores,n!==null))for(var r=0;r<n.length;r++){var i=n[r],s=i.getSnapshot;i=i.value;try{if(!En(s(),i))return!1}catch{return!1}}}if(n=e.child,e.subtreeFlags&16384&&n!==null)n.return=e,e=n;else{if(e===t)break;for(;e.sibling===null;){if(e.return===null||e.return===t)return!0;e=e.return}e.sibling.return=e.return,e=e.sibling}}return!0}function Sr(t,e){for(e&=~sf,e&=~ju,t.suspendedLanes|=e,t.pingedLanes&=~e,t=t.expirationTimes;0<e;){var n=31-_n(e),r=1<<n;t[n]=-1,e&=~r}}function bm(t){if(ge&6)throw Error(U(327));xs();var e=$l(t,0);if(!(e&1))return jt(t,Be()),null;var n=au(t,e);if(t.tag!==0&&n===2){var r=gd(t);r!==0&&(e=r,n=qd(t,r))}if(n===1)throw n=ua,Si(t,0),Sr(t,e),jt(t,Be()),n;if(n===6)throw Error(U(345));return t.finishedWork=t.current.alternate,t.finishedLanes=e,vi(t,Vt,Hn),jt(t,Be()),null}function af(t,e){var n=ge;ge|=1;try{return t(e)}finally{ge=n,ge===0&&(Vs=Be()+500,Vu&&Jr())}}function Pi(t){Ir!==null&&Ir.tag===0&&!(ge&6)&&xs();var e=ge;ge|=1;var n=on.transition,r=_e;try{if(on.transition=null,_e=1,t)return t()}finally{_e=r,on.transition=n,ge=e,!(ge&6)&&Jr()}}function lf(){Ft=ms.current,Ie(ms)}function Si(t,e){t.finishedWork=null,t.finishedLanes=0;var n=t.timeoutHandle;if(n!==-1&&(t.timeoutHandle=-1,tx(n)),He!==null)for(n=He.return;n!==null;){var r=n;switch(Uh(r),r.tag){case 1:r=r.type.childContextTypes,r!=null&&Kl();break;case 3:Ps(),Ie(Mt),Ie(Et),Yh();break;case 5:Qh(r);break;case 4:Ps();break;case 13:Ie(Ne);break;case 19:Ie(Ne);break;case 10:Hh(r.type._context);break;case 22:case 23:lf()}n=n.return}if(lt=t,He=t=Lr(t.current,null),ft=Ft=e,Je=0,ua=null,sf=ju=Ri=0,Vt=zo=null,xi!==null){for(e=0;e<xi.length;e++)if(n=xi[e],r=n.interleaved,r!==null){n.interleaved=null;var i=r.next,s=n.pending;if(s!==null){var o=s.next;s.next=i,r.next=o}n.pending=r}xi=null}return t}function Jy(t,e){do{var n=He;try{if(qh(),Il.current=ru,nu){for(var r=Ve.memoizedState;r!==null;){var i=r.queue;i!==null&&(i.pending=null),r=r.next}nu=!1}if(Ci=0,ot=Xe=Ve=null,Oo=!1,oa=0,rf.current=null,n===null||n.return===null){Je=1,ua=e,He=null;break}e:{var s=t,o=n.return,l=n,u=e;if(e=ft,l.flags|=32768,u!==null&&typeof u=="object"&&typeof u.then=="function"){var d=u,p=l,m=p.tag;if(!(p.mode&1)&&(m===0||m===11||m===15)){var v=p.alternate;v?(p.updateQueue=v.updateQueue,p.memoizedState=v.memoizedState,p.lanes=v.lanes):(p.updateQueue=null,p.memoizedState=null)}var I=cm(o);if(I!==null){I.flags&=-257,dm(I,o,l,s,e),I.mode&1&&um(s,d,e),e=I,u=d;var A=e.updateQueue;if(A===null){var P=new Set;P.add(u),e.updateQueue=P}else A.add(u);break e}else{if(!(e&1)){um(s,d,e),uf();break e}u=Error(U(426))}}else if(Ce&&l.mode&1){var M=cm(o);if(M!==null){!(M.flags&65536)&&(M.flags|=256),dm(M,o,l,s,e),Bh(Ns(u,l));break e}}s=u=Ns(u,l),Je!==4&&(Je=2),zo===null?zo=[s]:zo.push(s),s=o;do{switch(s.tag){case 3:s.flags|=65536,e&=-e,s.lanes|=e;var S=My(s,u,e);rm(s,S);break e;case 1:l=u;var x=s.type,k=s.stateNode;if(!(s.flags&128)&&(typeof x.getDerivedStateFromError=="function"||k!==null&&typeof k.componentDidCatch=="function"&&(Dr===null||!Dr.has(k)))){s.flags|=65536,e&=-e,s.lanes|=e;var V=Ly(s,l,e);rm(s,V);break e}}s=s.return}while(s!==null)}tv(n)}catch(F){e=F,He===n&&n!==null&&(He=n=n.return);continue}break}while(!0)}function Zy(){var t=iu.current;return iu.current=ru,t===null?ru:t}function uf(){(Je===0||Je===3||Je===2)&&(Je=4),lt===null||!(Ri&268435455)&&!(ju&268435455)||Sr(lt,ft)}function au(t,e){var n=ge;ge|=2;var r=Zy();(lt!==t||ft!==e)&&(Hn=null,Si(t,e));do try{kx();break}catch(i){Jy(t,i)}while(!0);if(qh(),ge=n,iu.current=r,He!==null)throw Error(U(261));return lt=null,ft=0,Je}function kx(){for(;He!==null;)ev(He)}function Ix(){for(;He!==null&&!J_();)ev(He)}function ev(t){var e=rv(t.alternate,t,Ft);t.memoizedProps=t.pendingProps,e===null?tv(t):He=e,rf.current=null}function tv(t){var e=t;do{var n=e.alternate;if(t=e.return,e.flags&32768){if(n=wx(n,e),n!==null){n.flags&=32767,He=n;return}if(t!==null)t.flags|=32768,t.subtreeFlags=0,t.deletions=null;else{Je=6,He=null;return}}else if(n=_x(n,e,Ft),n!==null){He=n;return}if(e=e.sibling,e!==null){He=e;return}He=e=t}while(e!==null);Je===0&&(Je=5)}function vi(t,e,n){var r=_e,i=on.transition;try{on.transition=null,_e=1,Ax(t,e,n,r)}finally{on.transition=i,_e=r}return null}function Ax(t,e,n,r){do xs();while(Ir!==null);if(ge&6)throw Error(U(327));n=t.finishedWork;var i=t.finishedLanes;if(n===null)return null;if(t.finishedWork=null,t.finishedLanes=0,n===t.current)throw Error(U(177));t.callbackNode=null,t.callbackPriority=0;var s=n.lanes|n.childLanes;if(lw(t,s),t===lt&&(He=lt=null,ft=0),!(n.subtreeFlags&2064)&&!(n.flags&2064)||cl||(cl=!0,iv(Bl,function(){return xs(),null})),s=(n.flags&15990)!==0,n.subtreeFlags&15990||s){s=on.transition,on.transition=null;var o=_e;_e=1;var l=ge;ge|=4,rf.current=null,Ex(t,n),Qy(n,t),Kw(Ed),ql=!!xd,Ed=xd=null,t.current=n,bx(n),Z_(),ge=l,_e=o,on.transition=s}else t.current=n;if(cl&&(cl=!1,Ir=t,ou=i),s=t.pendingLanes,s===0&&(Dr=null),nw(n.stateNode),jt(t,Be()),e!==null)for(r=t.onRecoverableError,n=0;n<e.length;n++)i=e[n],r(i.value,{componentStack:i.stack,digest:i.digest});if(su)throw su=!1,t=Bd,Bd=null,t;return ou&1&&t.tag!==0&&xs(),s=t.pendingLanes,s&1?t===$d?Uo++:(Uo=0,$d=t):Uo=0,Jr(),null}function xs(){if(Ir!==null){var t=M0(ou),e=on.transition,n=_e;try{if(on.transition=null,_e=16>t?16:t,Ir===null)var r=!1;else{if(t=Ir,Ir=null,ou=0,ge&6)throw Error(U(331));var i=ge;for(ge|=4,Q=t.current;Q!==null;){var s=Q,o=s.child;if(Q.flags&16){var l=s.deletions;if(l!==null){for(var u=0;u<l.length;u++){var d=l[u];for(Q=d;Q!==null;){var p=Q;switch(p.tag){case 0:case 11:case 15:Fo(8,p,s)}var m=p.child;if(m!==null)m.return=p,Q=m;else for(;Q!==null;){p=Q;var v=p.sibling,I=p.return;if(Wy(p),p===d){Q=null;break}if(v!==null){v.return=I,Q=v;break}Q=I}}}var A=s.alternate;if(A!==null){var P=A.child;if(P!==null){A.child=null;do{var M=P.sibling;P.sibling=null,P=M}while(P!==null)}}Q=s}}if(s.subtreeFlags&2064&&o!==null)o.return=s,Q=o;else e:for(;Q!==null;){if(s=Q,s.flags&2048)switch(s.tag){case 0:case 11:case 15:Fo(9,s,s.return)}var S=s.sibling;if(S!==null){S.return=s.return,Q=S;break e}Q=s.return}}var x=t.current;for(Q=x;Q!==null;){o=Q;var k=o.child;if(o.subtreeFlags&2064&&k!==null)k.return=o,Q=k;else e:for(o=x;Q!==null;){if(l=Q,l.flags&2048)try{switch(l.tag){case 0:case 11:case 15:Lu(9,l)}}catch(F){Fe(l,l.return,F)}if(l===o){Q=null;break e}var V=l.sibling;if(V!==null){V.return=l.return,Q=V;break e}Q=l.return}}if(ge=i,Jr(),Mn&&typeof Mn.onPostCommitFiberRoot=="function")try{Mn.onPostCommitFiberRoot(Au,t)}catch{}r=!0}return r}finally{_e=n,on.transition=e}}return!1}function Tm(t,e,n){e=Ns(n,e),e=My(t,e,1),t=Vr(t,e,1),e=It(),t!==null&&(ba(t,1,e),jt(t,e))}function Fe(t,e,n){if(t.tag===3)Tm(t,t,n);else for(;e!==null;){if(e.tag===3){Tm(e,t,n);break}else if(e.tag===1){var r=e.stateNode;if(typeof e.type.getDerivedStateFromError=="function"||typeof r.componentDidCatch=="function"&&(Dr===null||!Dr.has(r))){t=Ns(n,t),t=Ly(e,t,1),e=Vr(e,t,1),t=It(),e!==null&&(ba(e,1,t),jt(e,t));break}}e=e.return}}function Cx(t,e,n){var r=t.pingCache;r!==null&&r.delete(e),e=It(),t.pingedLanes|=t.suspendedLanes&n,lt===t&&(ft&n)===n&&(Je===4||Je===3&&(ft&130023424)===ft&&500>Be()-of?Si(t,0):sf|=n),jt(t,e)}function nv(t,e){e===0&&(t.mode&1?(e=el,el<<=1,!(el&130023424)&&(el=4194304)):e=1);var n=It();t=Zn(t,e),t!==null&&(ba(t,e,n),jt(t,n))}function Rx(t){var e=t.memoizedState,n=0;e!==null&&(n=e.retryLane),nv(t,n)}function Px(t,e){var n=0;switch(t.tag){case 13:var r=t.stateNode,i=t.memoizedState;i!==null&&(n=i.retryLane);break;case 19:r=t.stateNode;break;default:throw Error(U(314))}r!==null&&r.delete(e),nv(t,n)}var rv;rv=function(t,e,n){if(t!==null)if(t.memoizedProps!==e.pendingProps||Mt.current)Dt=!0;else{if(!(t.lanes&n)&&!(e.flags&128))return Dt=!1,vx(t,e,n);Dt=!!(t.flags&131072)}else Dt=!1,Ce&&e.flags&1048576&&ay(e,Xl,e.index);switch(e.lanes=0,e.tag){case 2:var r=e.type;Cl(t,e),t=e.pendingProps;var i=As(e,Et.current);ws(e,n),i=Jh(null,e,r,t,i,n);var s=Zh();return e.flags|=1,typeof i=="object"&&i!==null&&typeof i.render=="function"&&i.$$typeof===void 0?(e.tag=1,e.memoizedState=null,e.updateQueue=null,Lt(r)?(s=!0,Ql(e)):s=!1,e.memoizedState=i.state!==null&&i.state!==void 0?i.state:null,Gh(e),i.updater=Mu,e.stateNode=i,i._reactInternals=e,Pd(e,r,t,n),e=Dd(null,e,r,!0,s,n)):(e.tag=0,Ce&&s&&zh(e),kt(null,e,i,n),e=e.child),e;case 16:r=e.elementType;e:{switch(Cl(t,e),t=e.pendingProps,i=r._init,r=i(r._payload),e.type=r,i=e.tag=Vx(r),t=mn(r,t),i){case 0:e=Vd(null,e,r,t,n);break e;case 1:e=pm(null,e,r,t,n);break e;case 11:e=hm(null,e,r,t,n);break e;case 14:e=fm(null,e,r,mn(r.type,t),n);break e}throw Error(U(306,r,""))}return e;case 0:return r=e.type,i=e.pendingProps,i=e.elementType===r?i:mn(r,i),Vd(t,e,r,i,n);case 1:return r=e.type,i=e.pendingProps,i=e.elementType===r?i:mn(r,i),pm(t,e,r,i,n);case 3:e:{if(zy(e),t===null)throw Error(U(387));r=e.pendingProps,s=e.memoizedState,i=s.element,fy(t,e),eu(e,r,null,n);var o=e.memoizedState;if(r=o.element,s.isDehydrated)if(s={element:r,isDehydrated:!1,cache:o.cache,pendingSuspenseBoundaries:o.pendingSuspenseBoundaries,transitions:o.transitions},e.updateQueue.baseState=s,e.memoizedState=s,e.flags&256){i=Ns(Error(U(423)),e),e=mm(t,e,r,n,i);break e}else if(r!==i){i=Ns(Error(U(424)),e),e=mm(t,e,r,n,i);break e}else for(zt=Nr(e.stateNode.containerInfo.firstChild),Ut=e,Ce=!0,yn=null,n=dy(e,null,r,n),e.child=n;n;)n.flags=n.flags&-3|4096,n=n.sibling;else{if(Cs(),r===i){e=er(t,e,n);break e}kt(t,e,r,n)}e=e.child}return e;case 5:return py(e),t===null&&Ad(e),r=e.type,i=e.pendingProps,s=t!==null?t.memoizedProps:null,o=i.children,bd(r,i)?o=null:s!==null&&bd(r,s)&&(e.flags|=32),Fy(t,e),kt(t,e,o,n),e.child;case 6:return t===null&&Ad(e),null;case 13:return Uy(t,e,n);case 4:return Kh(e,e.stateNode.containerInfo),r=e.pendingProps,t===null?e.child=Rs(e,null,r,n):kt(t,e,r,n),e.child;case 11:return r=e.type,i=e.pendingProps,i=e.elementType===r?i:mn(r,i),hm(t,e,r,i,n);case 7:return kt(t,e,e.pendingProps,n),e.child;case 8:return kt(t,e,e.pendingProps.children,n),e.child;case 12:return kt(t,e,e.pendingProps.children,n),e.child;case 10:e:{if(r=e.type._context,i=e.pendingProps,s=e.memoizedProps,o=i.value,be(Jl,r._currentValue),r._currentValue=o,s!==null)if(En(s.value,o)){if(s.children===i.children&&!Mt.current){e=er(t,e,n);break e}}else for(s=e.child,s!==null&&(s.return=e);s!==null;){var l=s.dependencies;if(l!==null){o=s.child;for(var u=l.firstContext;u!==null;){if(u.context===r){if(s.tag===1){u=Qn(-1,n&-n),u.tag=2;var d=s.updateQueue;if(d!==null){d=d.shared;var p=d.pending;p===null?u.next=u:(u.next=p.next,p.next=u),d.pending=u}}s.lanes|=n,u=s.alternate,u!==null&&(u.lanes|=n),Cd(s.return,n,e),l.lanes|=n;break}u=u.next}}else if(s.tag===10)o=s.type===e.type?null:s.child;else if(s.tag===18){if(o=s.return,o===null)throw Error(U(341));o.lanes|=n,l=o.alternate,l!==null&&(l.lanes|=n),Cd(o,n,e),o=s.sibling}else o=s.child;if(o!==null)o.return=s;else for(o=s;o!==null;){if(o===e){o=null;break}if(s=o.sibling,s!==null){s.return=o.return,o=s;break}o=o.return}s=o}kt(t,e,i.children,n),e=e.child}return e;case 9:return i=e.type,r=e.pendingProps.children,ws(e,n),i=an(i),r=r(i),e.flags|=1,kt(t,e,r,n),e.child;case 14:return r=e.type,i=mn(r,e.pendingProps),i=mn(r.type,i),fm(t,e,r,i,n);case 15:return jy(t,e,e.type,e.pendingProps,n);case 17:return r=e.type,i=e.pendingProps,i=e.elementType===r?i:mn(r,i),Cl(t,e),e.tag=1,Lt(r)?(t=!0,Ql(e)):t=!1,ws(e,n),Dy(e,r,i),Pd(e,r,i,n),Dd(null,e,r,!0,t,n);case 19:return By(t,e,n);case 22:return Oy(t,e,n)}throw Error(U(156,e.tag))};function iv(t,e){return P0(t,e)}function Nx(t,e,n,r){this.tag=t,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.ref=null,this.pendingProps=e,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=r,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function sn(t,e,n,r){return new Nx(t,e,n,r)}function cf(t){return t=t.prototype,!(!t||!t.isReactComponent)}function Vx(t){if(typeof t=="function")return cf(t)?1:0;if(t!=null){if(t=t.$$typeof,t===Ah)return 11;if(t===Ch)return 14}return 2}function Lr(t,e){var n=t.alternate;return n===null?(n=sn(t.tag,e,t.key,t.mode),n.elementType=t.elementType,n.type=t.type,n.stateNode=t.stateNode,n.alternate=t,t.alternate=n):(n.pendingProps=e,n.type=t.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=t.flags&14680064,n.childLanes=t.childLanes,n.lanes=t.lanes,n.child=t.child,n.memoizedProps=t.memoizedProps,n.memoizedState=t.memoizedState,n.updateQueue=t.updateQueue,e=t.dependencies,n.dependencies=e===null?null:{lanes:e.lanes,firstContext:e.firstContext},n.sibling=t.sibling,n.index=t.index,n.ref=t.ref,n}function Nl(t,e,n,r,i,s){var o=2;if(r=t,typeof t=="function")cf(t)&&(o=1);else if(typeof t=="string")o=5;else e:switch(t){case ss:return ki(n.children,i,s,e);case Ih:o=8,i|=8;break;case td:return t=sn(12,n,e,i|2),t.elementType=td,t.lanes=s,t;case nd:return t=sn(13,n,e,i),t.elementType=nd,t.lanes=s,t;case rd:return t=sn(19,n,e,i),t.elementType=rd,t.lanes=s,t;case p0:return Ou(n,i,s,e);default:if(typeof t=="object"&&t!==null)switch(t.$$typeof){case h0:o=10;break e;case f0:o=9;break e;case Ah:o=11;break e;case Ch:o=14;break e;case Er:o=16,r=null;break e}throw Error(U(130,t==null?t:typeof t,""))}return e=sn(o,n,e,i),e.elementType=t,e.type=r,e.lanes=s,e}function ki(t,e,n,r){return t=sn(7,t,r,e),t.lanes=n,t}function Ou(t,e,n,r){return t=sn(22,t,r,e),t.elementType=p0,t.lanes=n,t.stateNode={isHidden:!1},t}function zc(t,e,n){return t=sn(6,t,null,e),t.lanes=n,t}function Uc(t,e,n){return e=sn(4,t.children!==null?t.children:[],t.key,e),e.lanes=n,e.stateNode={containerInfo:t.containerInfo,pendingChildren:null,implementation:t.implementation},e}function Dx(t,e,n,r,i){this.tag=e,this.containerInfo=t,this.finishedWork=this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.pendingContext=this.context=null,this.callbackPriority=0,this.eventTimes=xc(0),this.expirationTimes=xc(-1),this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=xc(0),this.identifierPrefix=r,this.onRecoverableError=i,this.mutableSourceEagerHydrationData=null}function df(t,e,n,r,i,s,o,l,u){return t=new Dx(t,e,n,l,u),e===1?(e=1,s===!0&&(e|=8)):e=0,s=sn(3,null,null,e),t.current=s,s.stateNode=t,s.memoizedState={element:r,isDehydrated:n,cache:null,transitions:null,pendingSuspenseBoundaries:null},Gh(s),t}function Mx(t,e,n){var r=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:is,key:r==null?null:""+r,children:t,containerInfo:e,implementation:n}}function sv(t){if(!t)return $r;t=t._reactInternals;e:{if(Li(t)!==t||t.tag!==1)throw Error(U(170));var e=t;do{switch(e.tag){case 3:e=e.stateNode.context;break e;case 1:if(Lt(e.type)){e=e.stateNode.__reactInternalMemoizedMergedChildContext;break e}}e=e.return}while(e!==null);throw Error(U(171))}if(t.tag===1){var n=t.type;if(Lt(n))return sy(t,n,e)}return e}function ov(t,e,n,r,i,s,o,l,u){return t=df(n,r,!0,t,i,s,o,l,u),t.context=sv(null),n=t.current,r=It(),i=Mr(n),s=Qn(r,i),s.callback=e??null,Vr(n,s,i),t.current.lanes=i,ba(t,i,r),jt(t,r),t}function Fu(t,e,n,r){var i=e.current,s=It(),o=Mr(i);return n=sv(n),e.context===null?e.context=n:e.pendingContext=n,e=Qn(s,o),e.payload={element:t},r=r===void 0?null:r,r!==null&&(e.callback=r),t=Vr(i,e,o),t!==null&&(wn(t,i,o,s),kl(t,i,o)),o}function lu(t){if(t=t.current,!t.child)return null;switch(t.child.tag){case 5:return t.child.stateNode;default:return t.child.stateNode}}function Sm(t,e){if(t=t.memoizedState,t!==null&&t.dehydrated!==null){var n=t.retryLane;t.retryLane=n!==0&&n<e?n:e}}function hf(t,e){Sm(t,e),(t=t.alternate)&&Sm(t,e)}function Lx(){return null}var av=typeof reportError=="function"?reportError:function(t){console.error(t)};function ff(t){this._internalRoot=t}zu.prototype.render=ff.prototype.render=function(t){var e=this._internalRoot;if(e===null)throw Error(U(409));Fu(t,e,null,null)};zu.prototype.unmount=ff.prototype.unmount=function(){var t=this._internalRoot;if(t!==null){this._internalRoot=null;var e=t.containerInfo;Pi(function(){Fu(null,t,null,null)}),e[Jn]=null}};function zu(t){this._internalRoot=t}zu.prototype.unstable_scheduleHydration=function(t){if(t){var e=O0();t={blockedOn:null,target:t,priority:e};for(var n=0;n<Tr.length&&e!==0&&e<Tr[n].priority;n++);Tr.splice(n,0,t),n===0&&z0(t)}};function pf(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)}function Uu(t){return!(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11&&(t.nodeType!==8||t.nodeValue!==" react-mount-point-unstable "))}function km(){}function jx(t,e,n,r,i){if(i){if(typeof r=="function"){var s=r;r=function(){var d=lu(o);s.call(d)}}var o=ov(e,r,t,0,null,!1,!1,"",km);return t._reactRootContainer=o,t[Jn]=o.current,ta(t.nodeType===8?t.parentNode:t),Pi(),o}for(;i=t.lastChild;)t.removeChild(i);if(typeof r=="function"){var l=r;r=function(){var d=lu(u);l.call(d)}}var u=df(t,0,!1,null,null,!1,!1,"",km);return t._reactRootContainer=u,t[Jn]=u.current,ta(t.nodeType===8?t.parentNode:t),Pi(function(){Fu(e,u,n,r)}),u}function Bu(t,e,n,r,i){var s=n._reactRootContainer;if(s){var o=s;if(typeof i=="function"){var l=i;i=function(){var u=lu(o);l.call(u)}}Fu(e,o,t,i)}else o=jx(n,e,t,i,r);return lu(o)}L0=function(t){switch(t.tag){case 3:var e=t.stateNode;if(e.current.memoizedState.isDehydrated){var n=Io(e.pendingLanes);n!==0&&(Nh(e,n|1),jt(e,Be()),!(ge&6)&&(Vs=Be()+500,Jr()))}break;case 13:Pi(function(){var r=Zn(t,1);if(r!==null){var i=It();wn(r,t,1,i)}}),hf(t,1)}};Vh=function(t){if(t.tag===13){var e=Zn(t,134217728);if(e!==null){var n=It();wn(e,t,134217728,n)}hf(t,134217728)}};j0=function(t){if(t.tag===13){var e=Mr(t),n=Zn(t,e);if(n!==null){var r=It();wn(n,t,e,r)}hf(t,e)}};O0=function(){return _e};F0=function(t,e){var n=_e;try{return _e=t,e()}finally{_e=n}};fd=function(t,e,n){switch(e){case"input":if(od(t,n),e=n.name,n.type==="radio"&&e!=null){for(n=t;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll("input[name="+JSON.stringify(""+e)+'][type="radio"]'),e=0;e<n.length;e++){var r=n[e];if(r!==t&&r.form===t.form){var i=Nu(r);if(!i)throw Error(U(90));g0(r),od(r,i)}}}break;case"textarea":v0(t,n);break;case"select":e=n.value,e!=null&&gs(t,!!n.multiple,e,!1)}};S0=af;k0=Pi;var Ox={usingClientEntryPoint:!1,Events:[Sa,us,Nu,b0,T0,af]},xo={findFiberByHostInstance:wi,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"},Fx={bundleType:xo.bundleType,version:xo.version,rendererPackageName:xo.rendererPackageName,rendererConfig:xo.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:ir.ReactCurrentDispatcher,findHostInstanceByFiber:function(t){return t=C0(t),t===null?null:t.stateNode},findFiberByHostInstance:xo.findFiberByHostInstance||Lx,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"){var dl=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!dl.isDisabled&&dl.supportsFiber)try{Au=dl.inject(Fx),Mn=dl}catch{}}$t.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Ox;$t.createPortal=function(t,e){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!pf(e))throw Error(U(200));return Mx(t,e,null,n)};$t.createRoot=function(t,e){if(!pf(t))throw Error(U(299));var n=!1,r="",i=av;return e!=null&&(e.unstable_strictMode===!0&&(n=!0),e.identifierPrefix!==void 0&&(r=e.identifierPrefix),e.onRecoverableError!==void 0&&(i=e.onRecoverableError)),e=df(t,1,!1,null,null,n,!1,r,i),t[Jn]=e.current,ta(t.nodeType===8?t.parentNode:t),new ff(e)};$t.findDOMNode=function(t){if(t==null)return null;if(t.nodeType===1)return t;var e=t._reactInternals;if(e===void 0)throw typeof t.render=="function"?Error(U(188)):(t=Object.keys(t).join(","),Error(U(268,t)));return t=C0(e),t=t===null?null:t.stateNode,t};$t.flushSync=function(t){return Pi(t)};$t.hydrate=function(t,e,n){if(!Uu(e))throw Error(U(200));return Bu(null,t,e,!0,n)};$t.hydrateRoot=function(t,e,n){if(!pf(t))throw Error(U(405));var r=n!=null&&n.hydratedSources||null,i=!1,s="",o=av;if(n!=null&&(n.unstable_strictMode===!0&&(i=!0),n.identifierPrefix!==void 0&&(s=n.identifierPrefix),n.onRecoverableError!==void 0&&(o=n.onRecoverableError)),e=ov(e,null,t,1,n??null,i,!1,s,o),t[Jn]=e.current,ta(t),r)for(t=0;t<r.length;t++)n=r[t],i=n._getVersion,i=i(n._source),e.mutableSourceEagerHydrationData==null?e.mutableSourceEagerHydrationData=[n,i]:e.mutableSourceEagerHydrationData.push(n,i);return new zu(e)};$t.render=function(t,e,n){if(!Uu(e))throw Error(U(200));return Bu(null,t,e,!1,n)};$t.unmountComponentAtNode=function(t){if(!Uu(t))throw Error(U(40));return t._reactRootContainer?(Pi(function(){Bu(null,null,t,!1,function(){t._reactRootContainer=null,t[Jn]=null})}),!0):!1};$t.unstable_batchedUpdates=af;$t.unstable_renderSubtreeIntoContainer=function(t,e,n,r){if(!Uu(n))throw Error(U(200));if(t==null||t._reactInternals===void 0)throw Error(U(38));return Bu(t,e,n,!1,r)};$t.version="18.3.1-next-f1338f8080-20240426";function lv(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(lv)}catch(t){console.error(t)}}lv(),l0.exports=$t;var zx=l0.exports,Im=zx;Zc.createRoot=Im.createRoot,Zc.hydrateRoot=Im.hydrateRoot;/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ux=()=>{};var Am={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const uv=function(t){const e=[];let n=0;for(let r=0;r<t.length;r++){let i=t.charCodeAt(r);i<128?e[n++]=i:i<2048?(e[n++]=i>>6|192,e[n++]=i&63|128):(i&64512)===55296&&r+1<t.length&&(t.charCodeAt(r+1)&64512)===56320?(i=65536+((i&1023)<<10)+(t.charCodeAt(++r)&1023),e[n++]=i>>18|240,e[n++]=i>>12&63|128,e[n++]=i>>6&63|128,e[n++]=i&63|128):(e[n++]=i>>12|224,e[n++]=i>>6&63|128,e[n++]=i&63|128)}return e},Bx=function(t){const e=[];let n=0,r=0;for(;n<t.length;){const i=t[n++];if(i<128)e[r++]=String.fromCharCode(i);else if(i>191&&i<224){const s=t[n++];e[r++]=String.fromCharCode((i&31)<<6|s&63)}else if(i>239&&i<365){const s=t[n++],o=t[n++],l=t[n++],u=((i&7)<<18|(s&63)<<12|(o&63)<<6|l&63)-65536;e[r++]=String.fromCharCode(55296+(u>>10)),e[r++]=String.fromCharCode(56320+(u&1023))}else{const s=t[n++],o=t[n++];e[r++]=String.fromCharCode((i&15)<<12|(s&63)<<6|o&63)}}return e.join("")},cv={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(t,e){if(!Array.isArray(t))throw Error("encodeByteArray takes an array as a parameter");this.init_();const n=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,r=[];for(let i=0;i<t.length;i+=3){const s=t[i],o=i+1<t.length,l=o?t[i+1]:0,u=i+2<t.length,d=u?t[i+2]:0,p=s>>2,m=(s&3)<<4|l>>4;let v=(l&15)<<2|d>>6,I=d&63;u||(I=64,o||(v=64)),r.push(n[p],n[m],n[v],n[I])}return r.join("")},encodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(t):this.encodeByteArray(uv(t),e)},decodeString(t,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(t):Bx(this.decodeStringToByteArray(t,e))},decodeStringToByteArray(t,e){this.init_();const n=e?this.charToByteMapWebSafe_:this.charToByteMap_,r=[];for(let i=0;i<t.length;){const s=n[t.charAt(i++)],l=i<t.length?n[t.charAt(i)]:0;++i;const d=i<t.length?n[t.charAt(i)]:64;++i;const m=i<t.length?n[t.charAt(i)]:64;if(++i,s==null||l==null||d==null||m==null)throw new $x;const v=s<<2|l>>4;if(r.push(v),d!==64){const I=l<<4&240|d>>2;if(r.push(I),m!==64){const A=d<<6&192|m;r.push(A)}}}return r},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let t=0;t<this.ENCODED_VALS.length;t++)this.byteToCharMap_[t]=this.ENCODED_VALS.charAt(t),this.charToByteMap_[this.byteToCharMap_[t]]=t,this.byteToCharMapWebSafe_[t]=this.ENCODED_VALS_WEBSAFE.charAt(t),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[t]]=t,t>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(t)]=t,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(t)]=t)}}};class $x extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const qx=function(t){const e=uv(t);return cv.encodeByteArray(e,!0)},uu=function(t){return qx(t).replace(/\./g,"")},Hx=function(t){try{return cv.decodeString(t,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wx(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gx=()=>Wx().__FIREBASE_DEFAULTS__,Kx=()=>{if(typeof process>"u"||typeof Am>"u")return;const t=Am.__FIREBASE_DEFAULTS__;if(t)return JSON.parse(t)},Qx=()=>{if(typeof document>"u")return;let t;try{t=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=t&&Hx(t[1]);return e&&JSON.parse(e)},mf=()=>{try{return Ux()||Gx()||Kx()||Qx()}catch(t){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${t}`);return}},Yx=t=>{var e,n;return(n=(e=mf())==null?void 0:e.emulatorHosts)==null?void 0:n[t]},Xx=t=>{const e=Yx(t);if(!e)return;const n=e.lastIndexOf(":");if(n<=0||n+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const r=parseInt(e.substring(n+1),10);return e[0]==="["?[e.substring(1,n-1),r]:[e.substring(0,n),r]},dv=()=>{var t;return(t=mf())==null?void 0:t.config};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jx{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,n)=>{this.resolve=e,this.reject=n})}wrapCallback(e){return(n,r)=>{n?this.reject(n):this.resolve(r),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(n):e(n,r))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zx(t,e){if(t.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const n={alg:"none",type:"JWT"},r=e||"demo-project",i=t.iat||0,s=t.sub||t.user_id;if(!s)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o={iss:`https://securetoken.google.com/${r}`,aud:r,iat:i,exp:i+3600,auth_time:i,sub:s,user_id:s,firebase:{sign_in_provider:"custom",identities:{}},...t};return[uu(JSON.stringify(n)),uu(JSON.stringify(o)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function e2(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function t2(){var e;const t=(e=mf())==null?void 0:e.forceEnvironment;if(t==="node")return!0;if(t==="browser")return!1;try{return Object.prototype.toString.call(global.process)==="[object process]"}catch{return!1}}function n2(){return!t2()&&!!navigator.userAgent&&navigator.userAgent.includes("Safari")&&!navigator.userAgent.includes("Chrome")}function r2(){try{return typeof indexedDB=="object"}catch{return!1}}function i2(){return new Promise((t,e)=>{try{let n=!0;const r="validate-browser-context-for-indexeddb-analytics-module",i=self.indexedDB.open(r);i.onsuccess=()=>{i.result.close(),n||self.indexedDB.deleteDatabase(r),t(!0)},i.onupgradeneeded=()=>{n=!1},i.onerror=()=>{var s;e(((s=i.error)==null?void 0:s.message)||"")}}catch(n){e(n)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const s2="FirebaseError";class $s extends Error{constructor(e,n,r){super(n),this.code=e,this.customData=r,this.name=s2,Object.setPrototypeOf(this,$s.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,hv.prototype.create)}}class hv{constructor(e,n,r){this.service=e,this.serviceName=n,this.errors=r}create(e,...n){const r=n[0]||{},i=`${this.service}/${e}`,s=this.errors[e],o=s?o2(s,r):"Error",l=`${this.serviceName}: ${o} (${i}).`;return new $s(i,l,r)}}function o2(t,e){return t.replace(a2,(n,r)=>{const i=e[r];return i!=null?String(i):`<${r}?>`})}const a2=/\{\$([^}]+)}/g;function cu(t,e){if(t===e)return!0;const n=Object.keys(t),r=Object.keys(e);for(const i of n){if(!r.includes(i))return!1;const s=t[i],o=e[i];if(Cm(s)&&Cm(o)){if(!cu(s,o))return!1}else if(s!==o)return!1}for(const i of r)if(!n.includes(i))return!1;return!0}function Cm(t){return t!==null&&typeof t=="object"}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ds(t){return t&&t._delegate?t._delegate:t}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function fv(t){try{return(t.startsWith("http://")||t.startsWith("https://")?new URL(t).hostname:t).endsWith(".cloudworkstations.dev")}catch{return!1}}async function l2(t){return(await fetch(t,{credentials:"include"})).ok}class ca{constructor(e,n,r){this.name=e,this.instanceFactory=n,this.type=r,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _i="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class u2{constructor(e,n){this.name=e,this.container=n,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const n=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(n)){const r=new Jx;if(this.instancesDeferred.set(n,r),this.isInitialized(n)||this.shouldAutoInitialize())try{const i=this.getOrInitializeService({instanceIdentifier:n});i&&r.resolve(i)}catch{}}return this.instancesDeferred.get(n).promise}getImmediate(e){const n=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),r=(e==null?void 0:e.optional)??!1;if(this.isInitialized(n)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:n})}catch(i){if(r)return null;throw i}else{if(r)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(d2(e))try{this.getOrInitializeService({instanceIdentifier:_i})}catch{}for(const[n,r]of this.instancesDeferred.entries()){const i=this.normalizeInstanceIdentifier(n);try{const s=this.getOrInitializeService({instanceIdentifier:i});r.resolve(s)}catch{}}}}clearInstance(e=_i){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(n=>"INTERNAL"in n).map(n=>n.INTERNAL.delete()),...e.filter(n=>"_delete"in n).map(n=>n._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=_i){return this.instances.has(e)}getOptions(e=_i){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:n={}}=e,r=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(r))throw Error(`${this.name}(${r}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const i=this.getOrInitializeService({instanceIdentifier:r,options:n});for(const[s,o]of this.instancesDeferred.entries()){const l=this.normalizeInstanceIdentifier(s);r===l&&o.resolve(i)}return i}onInit(e,n){const r=this.normalizeInstanceIdentifier(n),i=this.onInitCallbacks.get(r)??new Set;i.add(e),this.onInitCallbacks.set(r,i);const s=this.instances.get(r);return s&&e(s,r),()=>{i.delete(e)}}invokeOnInitCallbacks(e,n){const r=this.onInitCallbacks.get(n);if(r)for(const i of r)try{i(e,n)}catch{}}getOrInitializeService({instanceIdentifier:e,options:n={}}){let r=this.instances.get(e);if(!r&&this.component&&(r=this.component.instanceFactory(this.container,{instanceIdentifier:c2(e),options:n}),this.instances.set(e,r),this.instancesOptions.set(e,n),this.invokeOnInitCallbacks(r,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,r)}catch{}return r||null}normalizeInstanceIdentifier(e=_i){return this.component?this.component.multipleInstances?e:_i:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function c2(t){return t===_i?void 0:t}function d2(t){return t.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class h2{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const n=this.getProvider(e.name);if(n.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);n.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const n=new u2(e,this);return this.providers.set(e,n),n}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var fe;(function(t){t[t.DEBUG=0]="DEBUG",t[t.VERBOSE=1]="VERBOSE",t[t.INFO=2]="INFO",t[t.WARN=3]="WARN",t[t.ERROR=4]="ERROR",t[t.SILENT=5]="SILENT"})(fe||(fe={}));const f2={debug:fe.DEBUG,verbose:fe.VERBOSE,info:fe.INFO,warn:fe.WARN,error:fe.ERROR,silent:fe.SILENT},p2=fe.INFO,m2={[fe.DEBUG]:"log",[fe.VERBOSE]:"log",[fe.INFO]:"info",[fe.WARN]:"warn",[fe.ERROR]:"error"},g2=(t,e,...n)=>{if(e<t.logLevel)return;const r=new Date().toISOString(),i=m2[e];if(i)console[i](`[${r}]  ${t.name}:`,...n);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class pv{constructor(e){this.name=e,this._logLevel=p2,this._logHandler=g2,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in fe))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?f2[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,fe.DEBUG,...e),this._logHandler(this,fe.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,fe.VERBOSE,...e),this._logHandler(this,fe.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,fe.INFO,...e),this._logHandler(this,fe.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,fe.WARN,...e),this._logHandler(this,fe.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,fe.ERROR,...e),this._logHandler(this,fe.ERROR,...e)}}const y2=(t,e)=>e.some(n=>t instanceof n);let Rm,Pm;function v2(){return Rm||(Rm=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function _2(){return Pm||(Pm=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const mv=new WeakMap,Wd=new WeakMap,gv=new WeakMap,Bc=new WeakMap,gf=new WeakMap;function w2(t){const e=new Promise((n,r)=>{const i=()=>{t.removeEventListener("success",s),t.removeEventListener("error",o)},s=()=>{n(jr(t.result)),i()},o=()=>{r(t.error),i()};t.addEventListener("success",s),t.addEventListener("error",o)});return e.then(n=>{n instanceof IDBCursor&&mv.set(n,t)}).catch(()=>{}),gf.set(e,t),e}function x2(t){if(Wd.has(t))return;const e=new Promise((n,r)=>{const i=()=>{t.removeEventListener("complete",s),t.removeEventListener("error",o),t.removeEventListener("abort",o)},s=()=>{n(),i()},o=()=>{r(t.error||new DOMException("AbortError","AbortError")),i()};t.addEventListener("complete",s),t.addEventListener("error",o),t.addEventListener("abort",o)});Wd.set(t,e)}let Gd={get(t,e,n){if(t instanceof IDBTransaction){if(e==="done")return Wd.get(t);if(e==="objectStoreNames")return t.objectStoreNames||gv.get(t);if(e==="store")return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return jr(t[e])},set(t,e,n){return t[e]=n,!0},has(t,e){return t instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in t}};function E2(t){Gd=t(Gd)}function b2(t){return t===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...n){const r=t.call($c(this),e,...n);return gv.set(r,e.sort?e.sort():[e]),jr(r)}:_2().includes(t)?function(...e){return t.apply($c(this),e),jr(mv.get(this))}:function(...e){return jr(t.apply($c(this),e))}}function T2(t){return typeof t=="function"?b2(t):(t instanceof IDBTransaction&&x2(t),y2(t,v2())?new Proxy(t,Gd):t)}function jr(t){if(t instanceof IDBRequest)return w2(t);if(Bc.has(t))return Bc.get(t);const e=T2(t);return e!==t&&(Bc.set(t,e),gf.set(e,t)),e}const $c=t=>gf.get(t);function S2(t,e,{blocked:n,upgrade:r,blocking:i,terminated:s}={}){const o=indexedDB.open(t,e),l=jr(o);return r&&o.addEventListener("upgradeneeded",u=>{r(jr(o.result),u.oldVersion,u.newVersion,jr(o.transaction),u)}),n&&o.addEventListener("blocked",u=>n(u.oldVersion,u.newVersion,u)),l.then(u=>{s&&u.addEventListener("close",()=>s()),i&&u.addEventListener("versionchange",d=>i(d.oldVersion,d.newVersion,d))}).catch(()=>{}),l}const k2=["get","getKey","getAll","getAllKeys","count"],I2=["put","add","delete","clear"],qc=new Map;function Nm(t,e){if(!(t instanceof IDBDatabase&&!(e in t)&&typeof e=="string"))return;if(qc.get(e))return qc.get(e);const n=e.replace(/FromIndex$/,""),r=e!==n,i=I2.includes(n);if(!(n in(r?IDBIndex:IDBObjectStore).prototype)||!(i||k2.includes(n)))return;const s=async function(o,...l){const u=this.transaction(o,i?"readwrite":"readonly");let d=u.store;return r&&(d=d.index(l.shift())),(await Promise.all([d[n](...l),i&&u.done]))[0]};return qc.set(e,s),s}E2(t=>({...t,get:(e,n,r)=>Nm(e,n)||t.get(e,n,r),has:(e,n)=>!!Nm(e,n)||t.has(e,n)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class A2{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(n=>{if(C2(n)){const r=n.getImmediate();return`${r.library}/${r.version}`}else return null}).filter(n=>n).join(" ")}}function C2(t){const e=t.getComponent();return(e==null?void 0:e.type)==="VERSION"}const Kd="@firebase/app",Vm="0.14.11";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const tr=new pv("@firebase/app"),R2="@firebase/app-compat",P2="@firebase/analytics-compat",N2="@firebase/analytics",V2="@firebase/app-check-compat",D2="@firebase/app-check",M2="@firebase/auth",L2="@firebase/auth-compat",j2="@firebase/database",O2="@firebase/data-connect",F2="@firebase/database-compat",z2="@firebase/functions",U2="@firebase/functions-compat",B2="@firebase/installations",$2="@firebase/installations-compat",q2="@firebase/messaging",H2="@firebase/messaging-compat",W2="@firebase/performance",G2="@firebase/performance-compat",K2="@firebase/remote-config",Q2="@firebase/remote-config-compat",Y2="@firebase/storage",X2="@firebase/storage-compat",J2="@firebase/firestore",Z2="@firebase/ai",eE="@firebase/firestore-compat",tE="firebase",nE="12.12.0";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qd="[DEFAULT]",rE={[Kd]:"fire-core",[R2]:"fire-core-compat",[N2]:"fire-analytics",[P2]:"fire-analytics-compat",[D2]:"fire-app-check",[V2]:"fire-app-check-compat",[M2]:"fire-auth",[L2]:"fire-auth-compat",[j2]:"fire-rtdb",[O2]:"fire-data-connect",[F2]:"fire-rtdb-compat",[z2]:"fire-fn",[U2]:"fire-fn-compat",[B2]:"fire-iid",[$2]:"fire-iid-compat",[q2]:"fire-fcm",[H2]:"fire-fcm-compat",[W2]:"fire-perf",[G2]:"fire-perf-compat",[K2]:"fire-rc",[Q2]:"fire-rc-compat",[Y2]:"fire-gcs",[X2]:"fire-gcs-compat",[J2]:"fire-fst",[eE]:"fire-fst-compat",[Z2]:"fire-vertex","fire-js":"fire-js",[tE]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const da=new Map,iE=new Map,Yd=new Map;function Dm(t,e){try{t.container.addComponent(e)}catch(n){tr.debug(`Component ${e.name} failed to register with FirebaseApp ${t.name}`,n)}}function du(t){const e=t.name;if(Yd.has(e))return tr.debug(`There were multiple attempts to register component ${e}.`),!1;Yd.set(e,t);for(const n of da.values())Dm(n,t);for(const n of iE.values())Dm(n,t);return!0}function sE(t,e){const n=t.container.getProvider("heartbeat").getImmediate({optional:!0});return n&&n.triggerHeartbeat(),t.container.getProvider(e)}function oE(t){return t==null?!1:t.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const aE={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Or=new hv("app","Firebase",aE);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lE{constructor(e,n,r){this._isDeleted=!1,this._options={...e},this._config={...n},this._name=n.name,this._automaticDataCollectionEnabled=n.automaticDataCollectionEnabled,this._container=r,this.container.addComponent(new ca("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw Or.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const uE=nE;function yv(t,e={}){let n=t;typeof e!="object"&&(e={name:e});const r={name:Qd,automaticDataCollectionEnabled:!0,...e},i=r.name;if(typeof i!="string"||!i)throw Or.create("bad-app-name",{appName:String(i)});if(n||(n=dv()),!n)throw Or.create("no-options");const s=da.get(i);if(s){if(cu(n,s.options)&&cu(r,s.config))return s;throw Or.create("duplicate-app",{appName:i})}const o=new h2(i);for(const u of Yd.values())o.addComponent(u);const l=new lE(n,r,o);return da.set(i,l),l}function cE(t=Qd){const e=da.get(t);if(!e&&t===Qd&&dv())return yv();if(!e)throw Or.create("no-app",{appName:t});return e}function Mm(){return Array.from(da.values())}function Es(t,e,n){let r=rE[t]??t;n&&(r+=`-${n}`);const i=r.match(/\s|\//),s=e.match(/\s|\//);if(i||s){const o=[`Unable to register library "${r}" with version "${e}":`];i&&o.push(`library name "${r}" contains illegal characters (whitespace or "/")`),i&&s&&o.push("and"),s&&o.push(`version name "${e}" contains illegal characters (whitespace or "/")`),tr.warn(o.join(" "));return}du(new ca(`${r}-version`,()=>({library:r,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dE="firebase-heartbeat-database",hE=1,ha="firebase-heartbeat-store";let Hc=null;function vv(){return Hc||(Hc=S2(dE,hE,{upgrade:(t,e)=>{switch(e){case 0:try{t.createObjectStore(ha)}catch(n){console.warn(n)}}}}).catch(t=>{throw Or.create("idb-open",{originalErrorMessage:t.message})})),Hc}async function fE(t){try{const n=(await vv()).transaction(ha),r=await n.objectStore(ha).get(_v(t));return await n.done,r}catch(e){if(e instanceof $s)tr.warn(e.message);else{const n=Or.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});tr.warn(n.message)}}}async function Lm(t,e){try{const r=(await vv()).transaction(ha,"readwrite");await r.objectStore(ha).put(e,_v(t)),await r.done}catch(n){if(n instanceof $s)tr.warn(n.message);else{const r=Or.create("idb-set",{originalErrorMessage:n==null?void 0:n.message});tr.warn(r.message)}}}function _v(t){return`${t.name}!${t.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pE=1024,mE=30;class gE{constructor(e){this.container=e,this._heartbeatsCache=null;const n=this.container.getProvider("app").getImmediate();this._storage=new vE(n),this._heartbeatsCachePromise=this._storage.read().then(r=>(this._heartbeatsCache=r,r))}async triggerHeartbeat(){var e,n;try{const i=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),s=jm();if(((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((n=this._heartbeatsCache)==null?void 0:n.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===s||this._heartbeatsCache.heartbeats.some(o=>o.date===s))return;if(this._heartbeatsCache.heartbeats.push({date:s,agent:i}),this._heartbeatsCache.heartbeats.length>mE){const o=_E(this._heartbeatsCache.heartbeats);this._heartbeatsCache.heartbeats.splice(o,1)}return this._storage.overwrite(this._heartbeatsCache)}catch(r){tr.warn(r)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)==null?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const n=jm(),{heartbeatsToSend:r,unsentEntries:i}=yE(this._heartbeatsCache.heartbeats),s=uu(JSON.stringify({version:2,heartbeats:r}));return this._heartbeatsCache.lastSentHeartbeatDate=n,i.length>0?(this._heartbeatsCache.heartbeats=i,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),s}catch(n){return tr.warn(n),""}}}function jm(){return new Date().toISOString().substring(0,10)}function yE(t,e=pE){const n=[];let r=t.slice();for(const i of t){const s=n.find(o=>o.agent===i.agent);if(s){if(s.dates.push(i.date),Om(n)>e){s.dates.pop();break}}else if(n.push({agent:i.agent,dates:[i.date]}),Om(n)>e){n.pop();break}r=r.slice(1)}return{heartbeatsToSend:n,unsentEntries:r}}class vE{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return r2()?i2().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const n=await fE(this.app);return n!=null&&n.heartbeats?n:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return Lm(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){if(await this._canUseIndexedDBPromise){const r=await this.read();return Lm(this.app,{lastSentHeartbeatDate:e.lastSentHeartbeatDate??r.lastSentHeartbeatDate,heartbeats:[...r.heartbeats,...e.heartbeats]})}else return}}function Om(t){return uu(JSON.stringify({version:2,heartbeats:t})).length}function _E(t){if(t.length===0)return-1;let e=0,n=t[0].date;for(let r=1;r<t.length;r++)t[r].date<n&&(n=t[r].date,e=r);return e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function wE(t){du(new ca("platform-logger",e=>new A2(e),"PRIVATE")),du(new ca("heartbeat",e=>new gE(e),"PRIVATE")),Es(Kd,Vm,t),Es(Kd,Vm,"esm2020"),Es("fire-js","")}wE("");var xE="firebase",EE="12.12.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Es(xE,EE,"app");var Fm=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var Fr,wv;(function(){var t;/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/function e(w,y){function _(){}_.prototype=y.prototype,w.F=y.prototype,w.prototype=new _,w.prototype.constructor=w,w.D=function(b,T,C){for(var E=Array(arguments.length-2),J=2;J<arguments.length;J++)E[J-2]=arguments[J];return y.prototype[T].apply(b,E)}}function n(){this.blockSize=-1}function r(){this.blockSize=-1,this.blockSize=64,this.g=Array(4),this.C=Array(this.blockSize),this.o=this.h=0,this.u()}e(r,n),r.prototype.u=function(){this.g[0]=1732584193,this.g[1]=4023233417,this.g[2]=2562383102,this.g[3]=271733878,this.o=this.h=0};function i(w,y,_){_||(_=0);const b=Array(16);if(typeof y=="string")for(var T=0;T<16;++T)b[T]=y.charCodeAt(_++)|y.charCodeAt(_++)<<8|y.charCodeAt(_++)<<16|y.charCodeAt(_++)<<24;else for(T=0;T<16;++T)b[T]=y[_++]|y[_++]<<8|y[_++]<<16|y[_++]<<24;y=w.g[0],_=w.g[1],T=w.g[2];let C=w.g[3],E;E=y+(C^_&(T^C))+b[0]+3614090360&4294967295,y=_+(E<<7&4294967295|E>>>25),E=C+(T^y&(_^T))+b[1]+3905402710&4294967295,C=y+(E<<12&4294967295|E>>>20),E=T+(_^C&(y^_))+b[2]+606105819&4294967295,T=C+(E<<17&4294967295|E>>>15),E=_+(y^T&(C^y))+b[3]+3250441966&4294967295,_=T+(E<<22&4294967295|E>>>10),E=y+(C^_&(T^C))+b[4]+4118548399&4294967295,y=_+(E<<7&4294967295|E>>>25),E=C+(T^y&(_^T))+b[5]+1200080426&4294967295,C=y+(E<<12&4294967295|E>>>20),E=T+(_^C&(y^_))+b[6]+2821735955&4294967295,T=C+(E<<17&4294967295|E>>>15),E=_+(y^T&(C^y))+b[7]+4249261313&4294967295,_=T+(E<<22&4294967295|E>>>10),E=y+(C^_&(T^C))+b[8]+1770035416&4294967295,y=_+(E<<7&4294967295|E>>>25),E=C+(T^y&(_^T))+b[9]+2336552879&4294967295,C=y+(E<<12&4294967295|E>>>20),E=T+(_^C&(y^_))+b[10]+4294925233&4294967295,T=C+(E<<17&4294967295|E>>>15),E=_+(y^T&(C^y))+b[11]+2304563134&4294967295,_=T+(E<<22&4294967295|E>>>10),E=y+(C^_&(T^C))+b[12]+1804603682&4294967295,y=_+(E<<7&4294967295|E>>>25),E=C+(T^y&(_^T))+b[13]+4254626195&4294967295,C=y+(E<<12&4294967295|E>>>20),E=T+(_^C&(y^_))+b[14]+2792965006&4294967295,T=C+(E<<17&4294967295|E>>>15),E=_+(y^T&(C^y))+b[15]+1236535329&4294967295,_=T+(E<<22&4294967295|E>>>10),E=y+(T^C&(_^T))+b[1]+4129170786&4294967295,y=_+(E<<5&4294967295|E>>>27),E=C+(_^T&(y^_))+b[6]+3225465664&4294967295,C=y+(E<<9&4294967295|E>>>23),E=T+(y^_&(C^y))+b[11]+643717713&4294967295,T=C+(E<<14&4294967295|E>>>18),E=_+(C^y&(T^C))+b[0]+3921069994&4294967295,_=T+(E<<20&4294967295|E>>>12),E=y+(T^C&(_^T))+b[5]+3593408605&4294967295,y=_+(E<<5&4294967295|E>>>27),E=C+(_^T&(y^_))+b[10]+38016083&4294967295,C=y+(E<<9&4294967295|E>>>23),E=T+(y^_&(C^y))+b[15]+3634488961&4294967295,T=C+(E<<14&4294967295|E>>>18),E=_+(C^y&(T^C))+b[4]+3889429448&4294967295,_=T+(E<<20&4294967295|E>>>12),E=y+(T^C&(_^T))+b[9]+568446438&4294967295,y=_+(E<<5&4294967295|E>>>27),E=C+(_^T&(y^_))+b[14]+3275163606&4294967295,C=y+(E<<9&4294967295|E>>>23),E=T+(y^_&(C^y))+b[3]+4107603335&4294967295,T=C+(E<<14&4294967295|E>>>18),E=_+(C^y&(T^C))+b[8]+1163531501&4294967295,_=T+(E<<20&4294967295|E>>>12),E=y+(T^C&(_^T))+b[13]+2850285829&4294967295,y=_+(E<<5&4294967295|E>>>27),E=C+(_^T&(y^_))+b[2]+4243563512&4294967295,C=y+(E<<9&4294967295|E>>>23),E=T+(y^_&(C^y))+b[7]+1735328473&4294967295,T=C+(E<<14&4294967295|E>>>18),E=_+(C^y&(T^C))+b[12]+2368359562&4294967295,_=T+(E<<20&4294967295|E>>>12),E=y+(_^T^C)+b[5]+4294588738&4294967295,y=_+(E<<4&4294967295|E>>>28),E=C+(y^_^T)+b[8]+2272392833&4294967295,C=y+(E<<11&4294967295|E>>>21),E=T+(C^y^_)+b[11]+1839030562&4294967295,T=C+(E<<16&4294967295|E>>>16),E=_+(T^C^y)+b[14]+4259657740&4294967295,_=T+(E<<23&4294967295|E>>>9),E=y+(_^T^C)+b[1]+2763975236&4294967295,y=_+(E<<4&4294967295|E>>>28),E=C+(y^_^T)+b[4]+1272893353&4294967295,C=y+(E<<11&4294967295|E>>>21),E=T+(C^y^_)+b[7]+4139469664&4294967295,T=C+(E<<16&4294967295|E>>>16),E=_+(T^C^y)+b[10]+3200236656&4294967295,_=T+(E<<23&4294967295|E>>>9),E=y+(_^T^C)+b[13]+681279174&4294967295,y=_+(E<<4&4294967295|E>>>28),E=C+(y^_^T)+b[0]+3936430074&4294967295,C=y+(E<<11&4294967295|E>>>21),E=T+(C^y^_)+b[3]+3572445317&4294967295,T=C+(E<<16&4294967295|E>>>16),E=_+(T^C^y)+b[6]+76029189&4294967295,_=T+(E<<23&4294967295|E>>>9),E=y+(_^T^C)+b[9]+3654602809&4294967295,y=_+(E<<4&4294967295|E>>>28),E=C+(y^_^T)+b[12]+3873151461&4294967295,C=y+(E<<11&4294967295|E>>>21),E=T+(C^y^_)+b[15]+530742520&4294967295,T=C+(E<<16&4294967295|E>>>16),E=_+(T^C^y)+b[2]+3299628645&4294967295,_=T+(E<<23&4294967295|E>>>9),E=y+(T^(_|~C))+b[0]+4096336452&4294967295,y=_+(E<<6&4294967295|E>>>26),E=C+(_^(y|~T))+b[7]+1126891415&4294967295,C=y+(E<<10&4294967295|E>>>22),E=T+(y^(C|~_))+b[14]+2878612391&4294967295,T=C+(E<<15&4294967295|E>>>17),E=_+(C^(T|~y))+b[5]+4237533241&4294967295,_=T+(E<<21&4294967295|E>>>11),E=y+(T^(_|~C))+b[12]+1700485571&4294967295,y=_+(E<<6&4294967295|E>>>26),E=C+(_^(y|~T))+b[3]+2399980690&4294967295,C=y+(E<<10&4294967295|E>>>22),E=T+(y^(C|~_))+b[10]+4293915773&4294967295,T=C+(E<<15&4294967295|E>>>17),E=_+(C^(T|~y))+b[1]+2240044497&4294967295,_=T+(E<<21&4294967295|E>>>11),E=y+(T^(_|~C))+b[8]+1873313359&4294967295,y=_+(E<<6&4294967295|E>>>26),E=C+(_^(y|~T))+b[15]+4264355552&4294967295,C=y+(E<<10&4294967295|E>>>22),E=T+(y^(C|~_))+b[6]+2734768916&4294967295,T=C+(E<<15&4294967295|E>>>17),E=_+(C^(T|~y))+b[13]+1309151649&4294967295,_=T+(E<<21&4294967295|E>>>11),E=y+(T^(_|~C))+b[4]+4149444226&4294967295,y=_+(E<<6&4294967295|E>>>26),E=C+(_^(y|~T))+b[11]+3174756917&4294967295,C=y+(E<<10&4294967295|E>>>22),E=T+(y^(C|~_))+b[2]+718787259&4294967295,T=C+(E<<15&4294967295|E>>>17),E=_+(C^(T|~y))+b[9]+3951481745&4294967295,w.g[0]=w.g[0]+y&4294967295,w.g[1]=w.g[1]+(T+(E<<21&4294967295|E>>>11))&4294967295,w.g[2]=w.g[2]+T&4294967295,w.g[3]=w.g[3]+C&4294967295}r.prototype.v=function(w,y){y===void 0&&(y=w.length);const _=y-this.blockSize,b=this.C;let T=this.h,C=0;for(;C<y;){if(T==0)for(;C<=_;)i(this,w,C),C+=this.blockSize;if(typeof w=="string"){for(;C<y;)if(b[T++]=w.charCodeAt(C++),T==this.blockSize){i(this,b),T=0;break}}else for(;C<y;)if(b[T++]=w[C++],T==this.blockSize){i(this,b),T=0;break}}this.h=T,this.o+=y},r.prototype.A=function(){var w=Array((this.h<56?this.blockSize:this.blockSize*2)-this.h);w[0]=128;for(var y=1;y<w.length-8;++y)w[y]=0;y=this.o*8;for(var _=w.length-8;_<w.length;++_)w[_]=y&255,y/=256;for(this.v(w),w=Array(16),y=0,_=0;_<4;++_)for(let b=0;b<32;b+=8)w[y++]=this.g[_]>>>b&255;return w};function s(w,y){var _=l;return Object.prototype.hasOwnProperty.call(_,w)?_[w]:_[w]=y(w)}function o(w,y){this.h=y;const _=[];let b=!0;for(let T=w.length-1;T>=0;T--){const C=w[T]|0;b&&C==y||(_[T]=C,b=!1)}this.g=_}var l={};function u(w){return-128<=w&&w<128?s(w,function(y){return new o([y|0],y<0?-1:0)}):new o([w|0],w<0?-1:0)}function d(w){if(isNaN(w)||!isFinite(w))return m;if(w<0)return M(d(-w));const y=[];let _=1;for(let b=0;w>=_;b++)y[b]=w/_|0,_*=4294967296;return new o(y,0)}function p(w,y){if(w.length==0)throw Error("number format error: empty string");if(y=y||10,y<2||36<y)throw Error("radix out of range: "+y);if(w.charAt(0)=="-")return M(p(w.substring(1),y));if(w.indexOf("-")>=0)throw Error('number format error: interior "-" character');const _=d(Math.pow(y,8));let b=m;for(let C=0;C<w.length;C+=8){var T=Math.min(8,w.length-C);const E=parseInt(w.substring(C,C+T),y);T<8?(T=d(Math.pow(y,T)),b=b.j(T).add(d(E))):(b=b.j(_),b=b.add(d(E)))}return b}var m=u(0),v=u(1),I=u(16777216);t=o.prototype,t.m=function(){if(P(this))return-M(this).m();let w=0,y=1;for(let _=0;_<this.g.length;_++){const b=this.i(_);w+=(b>=0?b:4294967296+b)*y,y*=4294967296}return w},t.toString=function(w){if(w=w||10,w<2||36<w)throw Error("radix out of range: "+w);if(A(this))return"0";if(P(this))return"-"+M(this).toString(w);const y=d(Math.pow(w,6));var _=this;let b="";for(;;){const T=V(_,y).g;_=S(_,T.j(y));let C=((_.g.length>0?_.g[0]:_.h)>>>0).toString(w);if(_=T,A(_))return C+b;for(;C.length<6;)C="0"+C;b=C+b}},t.i=function(w){return w<0?0:w<this.g.length?this.g[w]:this.h};function A(w){if(w.h!=0)return!1;for(let y=0;y<w.g.length;y++)if(w.g[y]!=0)return!1;return!0}function P(w){return w.h==-1}t.l=function(w){return w=S(this,w),P(w)?-1:A(w)?0:1};function M(w){const y=w.g.length,_=[];for(let b=0;b<y;b++)_[b]=~w.g[b];return new o(_,~w.h).add(v)}t.abs=function(){return P(this)?M(this):this},t.add=function(w){const y=Math.max(this.g.length,w.g.length),_=[];let b=0;for(let T=0;T<=y;T++){let C=b+(this.i(T)&65535)+(w.i(T)&65535),E=(C>>>16)+(this.i(T)>>>16)+(w.i(T)>>>16);b=E>>>16,C&=65535,E&=65535,_[T]=E<<16|C}return new o(_,_[_.length-1]&-2147483648?-1:0)};function S(w,y){return w.add(M(y))}t.j=function(w){if(A(this)||A(w))return m;if(P(this))return P(w)?M(this).j(M(w)):M(M(this).j(w));if(P(w))return M(this.j(M(w)));if(this.l(I)<0&&w.l(I)<0)return d(this.m()*w.m());const y=this.g.length+w.g.length,_=[];for(var b=0;b<2*y;b++)_[b]=0;for(b=0;b<this.g.length;b++)for(let T=0;T<w.g.length;T++){const C=this.i(b)>>>16,E=this.i(b)&65535,J=w.i(T)>>>16,Re=w.i(T)&65535;_[2*b+2*T]+=E*Re,x(_,2*b+2*T),_[2*b+2*T+1]+=C*Re,x(_,2*b+2*T+1),_[2*b+2*T+1]+=E*J,x(_,2*b+2*T+1),_[2*b+2*T+2]+=C*J,x(_,2*b+2*T+2)}for(w=0;w<y;w++)_[w]=_[2*w+1]<<16|_[2*w];for(w=y;w<2*y;w++)_[w]=0;return new o(_,0)};function x(w,y){for(;(w[y]&65535)!=w[y];)w[y+1]+=w[y]>>>16,w[y]&=65535,y++}function k(w,y){this.g=w,this.h=y}function V(w,y){if(A(y))throw Error("division by zero");if(A(w))return new k(m,m);if(P(w))return y=V(M(w),y),new k(M(y.g),M(y.h));if(P(y))return y=V(w,M(y)),new k(M(y.g),y.h);if(w.g.length>30){if(P(w)||P(y))throw Error("slowDivide_ only works with positive integers.");for(var _=v,b=y;b.l(w)<=0;)_=F(_),b=F(b);var T=B(_,1),C=B(b,1);for(b=B(b,2),_=B(_,2);!A(b);){var E=C.add(b);E.l(w)<=0&&(T=T.add(_),C=E),b=B(b,1),_=B(_,1)}return y=S(w,T.j(y)),new k(T,y)}for(T=m;w.l(y)>=0;){for(_=Math.max(1,Math.floor(w.m()/y.m())),b=Math.ceil(Math.log(_)/Math.LN2),b=b<=48?1:Math.pow(2,b-48),C=d(_),E=C.j(y);P(E)||E.l(w)>0;)_-=b,C=d(_),E=C.j(y);A(C)&&(C=v),T=T.add(C),w=S(w,E)}return new k(T,w)}t.B=function(w){return V(this,w).h},t.and=function(w){const y=Math.max(this.g.length,w.g.length),_=[];for(let b=0;b<y;b++)_[b]=this.i(b)&w.i(b);return new o(_,this.h&w.h)},t.or=function(w){const y=Math.max(this.g.length,w.g.length),_=[];for(let b=0;b<y;b++)_[b]=this.i(b)|w.i(b);return new o(_,this.h|w.h)},t.xor=function(w){const y=Math.max(this.g.length,w.g.length),_=[];for(let b=0;b<y;b++)_[b]=this.i(b)^w.i(b);return new o(_,this.h^w.h)};function F(w){const y=w.g.length+1,_=[];for(let b=0;b<y;b++)_[b]=w.i(b)<<1|w.i(b-1)>>>31;return new o(_,w.h)}function B(w,y){const _=y>>5;y%=32;const b=w.g.length-_,T=[];for(let C=0;C<b;C++)T[C]=y>0?w.i(C+_)>>>y|w.i(C+_+1)<<32-y:w.i(C+_);return new o(T,w.h)}r.prototype.digest=r.prototype.A,r.prototype.reset=r.prototype.u,r.prototype.update=r.prototype.v,wv=r,o.prototype.add=o.prototype.add,o.prototype.multiply=o.prototype.j,o.prototype.modulo=o.prototype.B,o.prototype.compare=o.prototype.l,o.prototype.toNumber=o.prototype.m,o.prototype.toString=o.prototype.toString,o.prototype.getBits=o.prototype.i,o.fromNumber=d,o.fromString=p,Fr=o}).apply(typeof Fm<"u"?Fm:typeof self<"u"?self:typeof window<"u"?window:{});var hl=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{};/** @license
Copyright The Closure Library Authors.
SPDX-License-Identifier: Apache-2.0
*/var xv,Co,Ev,Vl,Xd,bv,Tv,Sv;(function(){var t,e=Object.defineProperty;function n(a){a=[typeof globalThis=="object"&&globalThis,a,typeof window=="object"&&window,typeof self=="object"&&self,typeof hl=="object"&&hl];for(var c=0;c<a.length;++c){var h=a[c];if(h&&h.Math==Math)return h}throw Error("Cannot find global object")}var r=n(this);function i(a,c){if(c)e:{var h=r;a=a.split(".");for(var g=0;g<a.length-1;g++){var R=a[g];if(!(R in h))break e;h=h[R]}a=a[a.length-1],g=h[a],c=c(g),c!=g&&c!=null&&e(h,a,{configurable:!0,writable:!0,value:c})}}i("Symbol.dispose",function(a){return a||Symbol("Symbol.dispose")}),i("Array.prototype.values",function(a){return a||function(){return this[Symbol.iterator]()}}),i("Object.entries",function(a){return a||function(c){var h=[],g;for(g in c)Object.prototype.hasOwnProperty.call(c,g)&&h.push([g,c[g]]);return h}});/** @license

 Copyright The Closure Library Authors.
 SPDX-License-Identifier: Apache-2.0
*/var s=s||{},o=this||self;function l(a){var c=typeof a;return c=="object"&&a!=null||c=="function"}function u(a,c,h){return a.call.apply(a.bind,arguments)}function d(a,c,h){return d=u,d.apply(null,arguments)}function p(a,c){var h=Array.prototype.slice.call(arguments,1);return function(){var g=h.slice();return g.push.apply(g,arguments),a.apply(this,g)}}function m(a,c){function h(){}h.prototype=c.prototype,a.Z=c.prototype,a.prototype=new h,a.prototype.constructor=a,a.Ob=function(g,R,N){for(var q=Array(arguments.length-2),se=2;se<arguments.length;se++)q[se-2]=arguments[se];return c.prototype[R].apply(g,q)}}var v=typeof AsyncContext<"u"&&typeof AsyncContext.Snapshot=="function"?a=>a&&AsyncContext.Snapshot.wrap(a):a=>a;function I(a){const c=a.length;if(c>0){const h=Array(c);for(let g=0;g<c;g++)h[g]=a[g];return h}return[]}function A(a,c){for(let g=1;g<arguments.length;g++){const R=arguments[g];var h=typeof R;if(h=h!="object"?h:R?Array.isArray(R)?"array":h:"null",h=="array"||h=="object"&&typeof R.length=="number"){h=a.length||0;const N=R.length||0;a.length=h+N;for(let q=0;q<N;q++)a[h+q]=R[q]}else a.push(R)}}class P{constructor(c,h){this.i=c,this.j=h,this.h=0,this.g=null}get(){let c;return this.h>0?(this.h--,c=this.g,this.g=c.next,c.next=null):c=this.i(),c}}function M(a){o.setTimeout(()=>{throw a},0)}function S(){var a=w;let c=null;return a.g&&(c=a.g,a.g=a.g.next,a.g||(a.h=null),c.next=null),c}class x{constructor(){this.h=this.g=null}add(c,h){const g=k.get();g.set(c,h),this.h?this.h.next=g:this.g=g,this.h=g}}var k=new P(()=>new V,a=>a.reset());class V{constructor(){this.next=this.g=this.h=null}set(c,h){this.h=c,this.g=h,this.next=null}reset(){this.next=this.g=this.h=null}}let F,B=!1,w=new x,y=()=>{const a=Promise.resolve(void 0);F=()=>{a.then(_)}};function _(){for(var a;a=S();){try{a.h.call(a.g)}catch(h){M(h)}var c=k;c.j(a),c.h<100&&(c.h++,a.next=c.g,c.g=a)}B=!1}function b(){this.u=this.u,this.C=this.C}b.prototype.u=!1,b.prototype.dispose=function(){this.u||(this.u=!0,this.N())},b.prototype[Symbol.dispose]=function(){this.dispose()},b.prototype.N=function(){if(this.C)for(;this.C.length;)this.C.shift()()};function T(a,c){this.type=a,this.g=this.target=c,this.defaultPrevented=!1}T.prototype.h=function(){this.defaultPrevented=!0};var C=function(){if(!o.addEventListener||!Object.defineProperty)return!1;var a=!1,c=Object.defineProperty({},"passive",{get:function(){a=!0}});try{const h=()=>{};o.addEventListener("test",h,c),o.removeEventListener("test",h,c)}catch{}return a}();function E(a){return/^[\s\xa0]*$/.test(a)}function J(a,c){T.call(this,a?a.type:""),this.relatedTarget=this.g=this.target=null,this.button=this.screenY=this.screenX=this.clientY=this.clientX=0,this.key="",this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1,this.state=null,this.pointerId=0,this.pointerType="",this.i=null,a&&this.init(a,c)}m(J,T),J.prototype.init=function(a,c){const h=this.type=a.type,g=a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:null;this.target=a.target||a.srcElement,this.g=c,c=a.relatedTarget,c||(h=="mouseover"?c=a.fromElement:h=="mouseout"&&(c=a.toElement)),this.relatedTarget=c,g?(this.clientX=g.clientX!==void 0?g.clientX:g.pageX,this.clientY=g.clientY!==void 0?g.clientY:g.pageY,this.screenX=g.screenX||0,this.screenY=g.screenY||0):(this.clientX=a.clientX!==void 0?a.clientX:a.pageX,this.clientY=a.clientY!==void 0?a.clientY:a.pageY,this.screenX=a.screenX||0,this.screenY=a.screenY||0),this.button=a.button,this.key=a.key||"",this.ctrlKey=a.ctrlKey,this.altKey=a.altKey,this.shiftKey=a.shiftKey,this.metaKey=a.metaKey,this.pointerId=a.pointerId||0,this.pointerType=a.pointerType,this.state=a.state,this.i=a,a.defaultPrevented&&J.Z.h.call(this)},J.prototype.h=function(){J.Z.h.call(this);const a=this.i;a.preventDefault?a.preventDefault():a.returnValue=!1};var Re="closure_listenable_"+(Math.random()*1e6|0),bt=0;function Le(a,c,h,g,R){this.listener=a,this.proxy=null,this.src=c,this.type=h,this.capture=!!g,this.ha=R,this.key=++bt,this.da=this.fa=!1}function H(a){a.da=!0,a.listener=null,a.proxy=null,a.src=null,a.ha=null}function Y(a,c,h){for(const g in a)c.call(h,a[g],g,a)}function te(a,c){for(const h in a)c.call(void 0,a[h],h,a)}function we(a){const c={};for(const h in a)c[h]=a[h];return c}const oe="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function Tn(a,c){let h,g;for(let R=1;R<arguments.length;R++){g=arguments[R];for(h in g)a[h]=g[h];for(let N=0;N<oe.length;N++)h=oe[N],Object.prototype.hasOwnProperty.call(g,h)&&(a[h]=g[h])}}function ut(a){this.src=a,this.g={},this.h=0}ut.prototype.add=function(a,c,h,g,R){const N=a.toString();a=this.g[N],a||(a=this.g[N]=[],this.h++);const q=Tt(a,c,g,R);return q>-1?(c=a[q],h||(c.fa=!1)):(c=new Le(c,this.src,N,!!g,R),c.fa=h,a.push(c)),c};function Ke(a,c){const h=c.type;if(h in a.g){var g=a.g[h],R=Array.prototype.indexOf.call(g,c,void 0),N;(N=R>=0)&&Array.prototype.splice.call(g,R,1),N&&(H(c),a.g[h].length==0&&(delete a.g[h],a.h--))}}function Tt(a,c,h,g){for(let R=0;R<a.length;++R){const N=a[R];if(!N.da&&N.listener==c&&N.capture==!!h&&N.ha==g)return R}return-1}var Ht="closure_lm_"+(Math.random()*1e6|0),ei={};function sr(a,c,h,g,R){if(Array.isArray(c)){for(let N=0;N<c.length;N++)sr(a,c[N],h,g,R);return null}return h=Js(h),a&&a[Re]?a.J(c,h,l(g)?!!g.capture:!1,R):Ui(a,c,h,!1,g,R)}function Ui(a,c,h,g,R,N){if(!c)throw Error("Invalid event type");const q=l(R)?!!R.capture:!!R;let se=Ys(a);if(se||(a[Ht]=se=new ut(a)),h=se.add(c,h,g,q,N),h.proxy)return h;if(g=sc(),h.proxy=g,g.src=a,g.listener=h,a.addEventListener)C||(R=q),R===void 0&&(R=!1),a.addEventListener(c.toString(),g,R);else if(a.attachEvent)a.attachEvent($i(c.toString()),g);else if(a.addListener&&a.removeListener)a.addListener(g);else throw Error("addEventListener and attachEvent are unavailable.");return h}function sc(){function a(h){return c.call(a.src,a.listener,h)}const c=Na;return a}function Qs(a,c,h,g,R){if(Array.isArray(c))for(var N=0;N<c.length;N++)Qs(a,c[N],h,g,R);else g=l(g)?!!g.capture:!!g,h=Js(h),a&&a[Re]?(a=a.i,N=String(c).toString(),N in a.g&&(c=a.g[N],h=Tt(c,h,g,R),h>-1&&(H(c[h]),Array.prototype.splice.call(c,h,1),c.length==0&&(delete a.g[N],a.h--)))):a&&(a=Ys(a))&&(c=a.g[c.toString()],a=-1,c&&(a=Tt(c,h,g,R)),(h=a>-1?c[a]:null)&&Bi(h))}function Bi(a){if(typeof a!="number"&&a&&!a.da){var c=a.src;if(c&&c[Re])Ke(c.i,a);else{var h=a.type,g=a.proxy;c.removeEventListener?c.removeEventListener(h,g,a.capture):c.detachEvent?c.detachEvent($i(h),g):c.addListener&&c.removeListener&&c.removeListener(g),(h=Ys(c))?(Ke(h,a),h.h==0&&(h.src=null,c[Ht]=null)):H(a)}}}function $i(a){return a in ei?ei[a]:ei[a]="on"+a}function Na(a,c){if(a.da)a=!0;else{c=new J(c,this);const h=a.listener,g=a.ha||a.src;a.fa&&Bi(a),a=h.call(g,c)}return a}function Ys(a){return a=a[Ht],a instanceof ut?a:null}var Xs="__closure_events_fn_"+(Math.random()*1e9>>>0);function Js(a){return typeof a=="function"?a:(a[Xs]||(a[Xs]=function(c){return a.handleEvent(c)}),a[Xs])}function et(){b.call(this),this.i=new ut(this),this.M=this,this.G=null}m(et,b),et.prototype[Re]=!0,et.prototype.removeEventListener=function(a,c,h,g){Qs(this,a,c,h,g)};function tt(a,c){var h,g=a.G;if(g)for(h=[];g;g=g.G)h.push(g);if(a=a.M,g=c.type||c,typeof c=="string")c=new T(c,a);else if(c instanceof T)c.target=c.target||a;else{var R=c;c=new T(g,a),Tn(c,R)}R=!0;let N,q;if(h)for(q=h.length-1;q>=0;q--)N=c.g=h[q],R=or(N,g,!0,c)&&R;if(N=c.g=a,R=or(N,g,!0,c)&&R,R=or(N,g,!1,c)&&R,h)for(q=0;q<h.length;q++)N=c.g=h[q],R=or(N,g,!1,c)&&R}et.prototype.N=function(){if(et.Z.N.call(this),this.i){var a=this.i;for(const c in a.g){const h=a.g[c];for(let g=0;g<h.length;g++)H(h[g]);delete a.g[c],a.h--}}this.G=null},et.prototype.J=function(a,c,h,g){return this.i.add(String(a),c,!1,h,g)},et.prototype.K=function(a,c,h,g){return this.i.add(String(a),c,!0,h,g)};function or(a,c,h,g){if(c=a.i.g[String(c)],!c)return!0;c=c.concat();let R=!0;for(let N=0;N<c.length;++N){const q=c[N];if(q&&!q.da&&q.capture==h){const se=q.listener,Ye=q.ha||q.src;q.fa&&Ke(a.i,q),R=se.call(Ye,g)!==!1&&R}}return R&&!g.defaultPrevented}function oc(a,c){if(typeof a!="function")if(a&&typeof a.handleEvent=="function")a=d(a.handleEvent,a);else throw Error("Invalid listener argument");return Number(c)>2147483647?-1:o.setTimeout(a,c||0)}function Va(a){a.g=oc(()=>{a.g=null,a.i&&(a.i=!1,Va(a))},a.l);const c=a.h;a.h=null,a.m.apply(null,c)}class Zs extends b{constructor(c,h){super(),this.m=c,this.l=h,this.h=null,this.i=!1,this.g=null}j(c){this.h=arguments,this.g?this.i=!0:Va(this)}N(){super.N(),this.g&&(o.clearTimeout(this.g),this.g=null,this.i=!1,this.h=null)}}function ti(a){b.call(this),this.h=a,this.g={}}m(ti,b);var Da=[];function pe(a){Y(a.g,function(c,h){this.g.hasOwnProperty(h)&&Bi(c)},a),a.g={}}ti.prototype.N=function(){ti.Z.N.call(this),pe(this)},ti.prototype.handleEvent=function(){throw Error("EventHandler.handleEvent not implemented")};var Sn=o.JSON.stringify,ar=o.JSON.parse,qi=class{stringify(a){return o.JSON.stringify(a,void 0)}parse(a){return o.JSON.parse(a,void 0)}};function eo(){}function to(){}var ni={OPEN:"a",hb:"b",ERROR:"c",tb:"d"};function Hi(){T.call(this,"d")}m(Hi,T);function no(){T.call(this,"c")}m(no,T);var kn={},Ma=null;function ri(){return Ma=Ma||new et}kn.Ia="serverreachability";function ii(a){T.call(this,kn.Ia,a)}m(ii,T);function si(a){const c=ri();tt(c,new ii(c))}kn.STAT_EVENT="statevent";function ro(a,c){T.call(this,kn.STAT_EVENT,a),this.stat=c}m(ro,T);function Qe(a){const c=ri();tt(c,new ro(c,a))}kn.Ja="timingevent";function io(a,c){T.call(this,kn.Ja,a),this.size=c}m(io,T);function oi(a,c){if(typeof a!="function")throw Error("Fn must not be null and must be a function");return o.setTimeout(function(){a()},c)}function Wi(){this.g=!0}Wi.prototype.ua=function(){this.g=!1};function ac(a,c,h,g,R,N){a.info(function(){if(a.g)if(N){var q="",se=N.split("&");for(let xe=0;xe<se.length;xe++){var Ye=se[xe].split("=");if(Ye.length>1){const it=Ye[0];Ye=Ye[1];const Cn=it.split("_");q=Cn.length>=2&&Cn[1]=="type"?q+(it+"="+Ye+"&"):q+(it+"=redacted&")}}}else q=null;else q=N;return"XMLHTTP REQ ("+g+") [attempt "+R+"]: "+c+`
`+h+`
`+q})}function ai(a,c,h,g,R,N,q){a.info(function(){return"XMLHTTP RESP ("+g+") [ attempt "+R+"]: "+c+`
`+h+`
`+N+" "+q})}function lr(a,c,h,g){a.info(function(){return"XMLHTTP TEXT ("+c+"): "+lc(a,h)+(g?" "+g:"")})}function li(a,c){a.info(function(){return"TIMEOUT: "+c})}Wi.prototype.info=function(){};function lc(a,c){if(!a.g)return c;if(!c)return null;try{const N=JSON.parse(c);if(N){for(a=0;a<N.length;a++)if(Array.isArray(N[a])){var h=N[a];if(!(h.length<2)){var g=h[1];if(Array.isArray(g)&&!(g.length<1)){var R=g[0];if(R!="noop"&&R!="stop"&&R!="close")for(let q=1;q<g.length;q++)g[q]=""}}}}return Sn(N)}catch{return c}}var ur={NO_ERROR:0,cb:1,qb:2,pb:3,kb:4,ob:5,rb:6,Ga:7,TIMEOUT:8,ub:9},so={ib:"complete",Fb:"success",ERROR:"error",Ga:"abort",xb:"ready",yb:"readystatechange",TIMEOUT:"timeout",sb:"incrementaldata",wb:"progress",lb:"downloadprogress",Nb:"uploadprogress"},nt;function un(){}m(un,eo),un.prototype.g=function(){return new XMLHttpRequest},nt=new un;function cn(a){return encodeURIComponent(String(a))}function cr(a){var c=1;a=a.split(":");const h=[];for(;c>0&&a.length;)h.push(a.shift()),c--;return a.length&&h.push(a.join(":")),h}function Un(a,c,h,g){this.j=a,this.i=c,this.l=h,this.S=g||1,this.V=new ti(this),this.H=45e3,this.J=null,this.o=!1,this.u=this.B=this.A=this.M=this.F=this.T=this.D=null,this.G=[],this.g=null,this.C=0,this.m=this.v=null,this.X=-1,this.K=!1,this.P=0,this.O=null,this.W=this.L=this.U=this.R=!1,this.h=new oo}function oo(){this.i=null,this.g="",this.h=!1}var Gi={},ui={};function dr(a,c,h){a.M=1,a.A=fi(je(c)),a.u=h,a.R=!0,La(a,null)}function La(a,c){a.F=Date.now(),Te(a),a.B=je(a.A);var h=a.B,g=a.S;Array.isArray(g)||(g=[String(g)]),Ba(h.i,"t",g),a.C=0,h=a.j.L,a.h=new oo,a.g=mp(a.j,h?c:null,!a.u),a.P>0&&(a.O=new Zs(d(a.Y,a,a.g),a.P)),c=a.V,h=a.g,g=a.ba;var R="readystatechange";Array.isArray(R)||(R&&(Da[0]=R.toString()),R=Da);for(let N=0;N<R.length;N++){const q=sr(h,R[N],g||c.handleEvent,!1,c.h||c);if(!q)break;c.g[q.key]=q}c=a.J?we(a.J):{},a.u?(a.v||(a.v="POST"),c["Content-Type"]="application/x-www-form-urlencoded",a.g.ea(a.B,a.v,a.u,c)):(a.v="GET",a.g.ea(a.B,a.v,null,c)),si(),ac(a.i,a.v,a.B,a.l,a.S,a.u)}Un.prototype.ba=function(a){a=a.target;const c=this.O;c&&Xt(a)==3?c.j():this.Y(a)},Un.prototype.Y=function(a){try{if(a==this.g)e:{const se=Xt(this.g),Ye=this.g.ya(),xe=this.g.ca();if(!(se<3)&&(se!=3||this.g&&(this.h.h||this.g.la()||$a(this.g)))){this.K||se!=4||Ye==7||(Ye==8||xe<=0?si(3):si(2)),Gt(this);var c=this.g.ca();this.X=c;var h=ja(this);if(this.o=c==200,ai(this.i,this.v,this.B,this.l,this.S,se,c),this.o){if(this.U&&!this.L){t:{if(this.g){var g,R=this.g;if((g=R.g?R.g.getResponseHeader("X-HTTP-Initial-Response"):null)&&!E(g)){var N=g;break t}}N=null}if(a=N)lr(this.i,this.l,a,"Initial handshake response via X-HTTP-Initial-Response"),this.L=!0,Bn(this,a);else{this.o=!1,this.m=3,Qe(12),In(this),ze(this);break e}}if(this.R){a=!0;let it;for(;!this.K&&this.C<h.length;)if(it=ce(this,h),it==ui){se==4&&(this.m=4,Qe(14),a=!1),lr(this.i,this.l,null,"[Incomplete Response]");break}else if(it==Gi){this.m=4,Qe(15),lr(this.i,this.l,h,"[Invalid Chunk]"),a=!1;break}else lr(this.i,this.l,it,null),Bn(this,it);if(ci(this)&&this.C!=0&&(this.h.g=this.h.g.slice(this.C),this.C=0),se!=4||h.length!=0||this.h.h||(this.m=1,Qe(16),a=!1),this.o=this.o&&a,!a)lr(this.i,this.l,h,"[Invalid Chunked Response]"),In(this),ze(this);else if(h.length>0&&!this.W){this.W=!0;var q=this.j;q.g==this&&q.aa&&!q.P&&(q.j.info("Great, no buffering proxy detected. Bytes received: "+h.length),pc(q),q.P=!0,Qe(11))}}else lr(this.i,this.l,h,null),Bn(this,h);se==4&&In(this),this.o&&!this.K&&(se==4?dp(this.j,this):(this.o=!1,Te(this)))}else dc(this.g),c==400&&h.indexOf("Unknown SID")>0?(this.m=3,Qe(12)):(this.m=0,Qe(13)),In(this),ze(this)}}}catch{}finally{}};function ja(a){if(!ci(a))return a.g.la();const c=$a(a.g);if(c==="")return"";let h="";const g=c.length,R=Xt(a.g)==4;if(!a.h.i){if(typeof TextDecoder>"u")return In(a),ze(a),"";a.h.i=new o.TextDecoder}for(let N=0;N<g;N++)a.h.h=!0,h+=a.h.i.decode(c[N],{stream:!(R&&N==g-1)});return c.length=0,a.h.g+=h,a.C=0,a.h.g}function ci(a){return a.g?a.v=="GET"&&a.M!=2&&a.j.Aa:!1}function ce(a,c){var h=a.C,g=c.indexOf(`
`,h);return g==-1?ui:(h=Number(c.substring(h,g)),isNaN(h)?Gi:(g+=1,g+h>c.length?ui:(c=c.slice(g,g+h),a.C=g+h,c)))}Un.prototype.cancel=function(){this.K=!0,In(this)};function Te(a){a.T=Date.now()+a.H,Wt(a,a.H)}function Wt(a,c){if(a.D!=null)throw Error("WatchDog timer not null");a.D=oi(d(a.aa,a),c)}function Gt(a){a.D&&(o.clearTimeout(a.D),a.D=null)}Un.prototype.aa=function(){this.D=null;const a=Date.now();a-this.T>=0?(li(this.i,this.B),this.M!=2&&(si(),Qe(17)),In(this),this.m=2,ze(this)):Wt(this,this.T-a)};function ze(a){a.j.I==0||a.K||dp(a.j,a)}function In(a){Gt(a);var c=a.O;c&&typeof c.dispose=="function"&&c.dispose(),a.O=null,pe(a.V),a.g&&(c=a.g,a.g=null,c.abort(),c.dispose())}function Bn(a,c){try{var h=a.j;if(h.I!=0&&(h.g==a||$e(h.h,a))){if(!a.L&&$e(h.h,a)&&h.I==3){try{var g=h.Ba.g.parse(c)}catch{g=null}if(Array.isArray(g)&&g.length==3){var R=g;if(R[0]==0){e:if(!h.v){if(h.g)if(h.g.F+3e3<a.F)Wa(h),qa(h);else break e;fc(h),Qe(18)}}else h.xa=R[1],0<h.xa-h.K&&R[2]<37500&&h.F&&h.A==0&&!h.C&&(h.C=oi(d(h.Va,h),6e3));di(h.h)<=1&&h.ta&&(h.ta=void 0)}else mi(h,11)}else if((a.L||h.g==a)&&Wa(h),!E(c))for(R=h.Ba.g.parse(c),c=0;c<R.length;c++){let xe=R[c];const it=xe[0];if(!(it<=h.K))if(h.K=it,xe=xe[1],h.I==2)if(xe[0]=="c"){h.M=xe[1],h.ba=xe[2];const Cn=xe[3];Cn!=null&&(h.ka=Cn,h.j.info("VER="+h.ka));const gi=xe[4];gi!=null&&(h.za=gi,h.j.info("SVER="+h.za));const vr=xe[5];vr!=null&&typeof vr=="number"&&vr>0&&(g=1.5*vr,h.O=g,h.j.info("backChannelRequestTimeoutMs_="+g)),g=h;const _r=a.g;if(_r){const Ka=_r.g?_r.g.getResponseHeader("X-Client-Wire-Protocol"):null;if(Ka){var N=g.h;N.g||Ka.indexOf("spdy")==-1&&Ka.indexOf("quic")==-1&&Ka.indexOf("h2")==-1||(N.j=N.l,N.g=new Set,N.h&&(hi(N,N.h),N.h=null))}if(g.G){const mc=_r.g?_r.g.getResponseHeader("X-HTTP-Session-Id"):null;mc&&(g.wa=mc,ye(g.J,g.G,mc))}}h.I=3,h.l&&h.l.ra(),h.aa&&(h.T=Date.now()-a.F,h.j.info("Handshake RTT: "+h.T+"ms")),g=h;var q=a;if(g.na=pp(g,g.L?g.ba:null,g.W),q.L){$n(g.h,q);var se=q,Ye=g.O;Ye&&(se.H=Ye),se.D&&(Gt(se),Te(se)),g.g=q}else up(g);h.i.length>0&&Ha(h)}else xe[0]!="stop"&&xe[0]!="close"||mi(h,7);else h.I==3&&(xe[0]=="stop"||xe[0]=="close"?xe[0]=="stop"?mi(h,7):hc(h):xe[0]!="noop"&&h.l&&h.l.qa(xe),h.A=0)}}si(4)}catch{}}var Oa=class{constructor(a,c){this.g=a,this.map=c}};function ao(a){this.l=a||10,o.PerformanceNavigationTiming?(a=o.performance.getEntriesByType("navigation"),a=a.length>0&&(a[0].nextHopProtocol=="hq"||a[0].nextHopProtocol=="h2")):a=!!(o.chrome&&o.chrome.loadTimes&&o.chrome.loadTimes()&&o.chrome.loadTimes().wasFetchedViaSpdy),this.j=a?this.l:1,this.g=null,this.j>1&&(this.g=new Set),this.h=null,this.i=[]}function Rt(a){return a.h?!0:a.g?a.g.size>=a.j:!1}function di(a){return a.h?1:a.g?a.g.size:0}function $e(a,c){return a.h?a.h==c:a.g?a.g.has(c):!1}function hi(a,c){a.g?a.g.add(c):a.h=c}function $n(a,c){a.h&&a.h==c?a.h=null:a.g&&a.g.has(c)&&a.g.delete(c)}ao.prototype.cancel=function(){if(this.i=hr(this),this.h)this.h.cancel(),this.h=null;else if(this.g&&this.g.size!==0){for(const a of this.g.values())a.cancel();this.g.clear()}};function hr(a){if(a.h!=null)return a.i.concat(a.h.G);if(a.g!=null&&a.g.size!==0){let c=a.i;for(const h of a.g.values())c=c.concat(h.G);return c}return I(a.i)}var Kt=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^\\\\/?#]*)@)?([^\\\\/?#]*?)(?::([0-9]+))?(?=[\\\\/?#]|$))?([^?#]+)?(?:\\?([^#]*))?(?:#([\\s\\S]*))?$");function lo(a,c){if(a){a=a.split("&");for(let h=0;h<a.length;h++){const g=a[h].indexOf("=");let R,N=null;g>=0?(R=a[h].substring(0,g),N=a[h].substring(g+1)):R=a[h],c(R,N?decodeURIComponent(N.replace(/\+/g," ")):"")}}}function Ae(a){this.g=this.o=this.j="",this.u=null,this.m=this.h="",this.l=!1;let c;a instanceof Ae?(this.l=a.l,dn(this,a.j),this.o=a.o,this.g=a.g,hn(this,a.u),this.h=a.h,qn(this,Qi(a.i)),this.m=a.m):a&&(c=String(a).match(Kt))?(this.l=!1,dn(this,c[1]||"",!0),this.o=fr(c[2]||""),this.g=fr(c[3]||"",!0),hn(this,c[4]),this.h=fr(c[5]||"",!0),qn(this,c[6]||"",!0),this.m=fr(c[7]||"")):(this.l=!1,this.i=new mr(null,this.l))}Ae.prototype.toString=function(){const a=[];var c=this.j;c&&a.push(fn(c,uo,!0),":");var h=this.g;return(h||c=="file")&&(a.push("//"),(c=this.o)&&a.push(fn(c,uo,!0),"@"),a.push(cn(h).replace(/%25([0-9a-fA-F]{2})/g,"%$1")),h=this.u,h!=null&&a.push(":",String(h))),(h=this.h)&&(this.g&&h.charAt(0)!="/"&&a.push("/"),a.push(fn(h,h.charAt(0)=="/"?za:Fa,!0))),(h=this.i.toString())&&a.push("?",h),(h=this.m)&&a.push("#",fn(h,co)),a.join("")},Ae.prototype.resolve=function(a){const c=je(this);let h=!!a.j;h?dn(c,a.j):h=!!a.o,h?c.o=a.o:h=!!a.g,h?c.g=a.g:h=a.u!=null;var g=a.h;if(h)hn(c,a.u);else if(h=!!a.h){if(g.charAt(0)!="/")if(this.g&&!this.h)g="/"+g;else{var R=c.h.lastIndexOf("/");R!=-1&&(g=c.h.slice(0,R+1)+g)}if(R=g,R==".."||R==".")g="";else if(R.indexOf("./")!=-1||R.indexOf("/.")!=-1){g=R.lastIndexOf("/",0)==0,R=R.split("/");const N=[];for(let q=0;q<R.length;){const se=R[q++];se=="."?g&&q==R.length&&N.push(""):se==".."?((N.length>1||N.length==1&&N[0]!="")&&N.pop(),g&&q==R.length&&N.push("")):(N.push(se),g=!0)}g=N.join("/")}else g=R}return h?c.h=g:h=a.i.toString()!=="",h?qn(c,Qi(a.i)):h=!!a.m,h&&(c.m=a.m),c};function je(a){return new Ae(a)}function dn(a,c,h){a.j=h?fr(c,!0):c,a.j&&(a.j=a.j.replace(/:$/,""))}function hn(a,c){if(c){if(c=Number(c),isNaN(c)||c<0)throw Error("Bad port number "+c);a.u=c}else a.u=null}function qn(a,c,h){c instanceof mr?(a.i=c,uc(a.i,a.l)):(h||(c=fn(c,Ua)),a.i=new mr(c,a.l))}function ye(a,c,h){a.i.set(c,h)}function fi(a){return ye(a,"zx",Math.floor(Math.random()*2147483648).toString(36)+Math.abs(Math.floor(Math.random()*2147483648)^Date.now()).toString(36)),a}function fr(a,c){return a?c?decodeURI(a.replace(/%25/g,"%2525")):decodeURIComponent(a):""}function fn(a,c,h){return typeof a=="string"?(a=encodeURI(a).replace(c,pr),h&&(a=a.replace(/%25([0-9a-fA-F]{2})/g,"%$1")),a):null}function pr(a){return a=a.charCodeAt(0),"%"+(a>>4&15).toString(16)+(a&15).toString(16)}var uo=/[#\/\?@]/g,Fa=/[#\?:]/g,za=/[#\?]/g,Ua=/[#\?@]/g,co=/#/g;function mr(a,c){this.h=this.g=null,this.i=a||null,this.j=!!c}function An(a){a.g||(a.g=new Map,a.h=0,a.i&&lo(a.i,function(c,h){a.add(decodeURIComponent(c.replace(/\+/g," ")),h)}))}t=mr.prototype,t.add=function(a,c){An(this),this.i=null,a=gr(this,a);let h=this.g.get(a);return h||this.g.set(a,h=[]),h.push(c),this.h+=1,this};function ho(a,c){An(a),c=gr(a,c),a.g.has(c)&&(a.i=null,a.h-=a.g.get(c).length,a.g.delete(c))}function Pt(a,c){return An(a),c=gr(a,c),a.g.has(c)}t.forEach=function(a,c){An(this),this.g.forEach(function(h,g){h.forEach(function(R){a.call(c,R,g,this)},this)},this)};function Ki(a,c){An(a);let h=[];if(typeof c=="string")Pt(a,c)&&(h=h.concat(a.g.get(gr(a,c))));else for(a=Array.from(a.g.values()),c=0;c<a.length;c++)h=h.concat(a[c]);return h}t.set=function(a,c){return An(this),this.i=null,a=gr(this,a),Pt(this,a)&&(this.h-=this.g.get(a).length),this.g.set(a,[c]),this.h+=1,this},t.get=function(a,c){return a?(a=Ki(this,a),a.length>0?String(a[0]):c):c};function Ba(a,c,h){ho(a,c),h.length>0&&(a.i=null,a.g.set(gr(a,c),I(h)),a.h+=h.length)}t.toString=function(){if(this.i)return this.i;if(!this.g)return"";const a=[],c=Array.from(this.g.keys());for(let g=0;g<c.length;g++){var h=c[g];const R=cn(h);h=Ki(this,h);for(let N=0;N<h.length;N++){let q=R;h[N]!==""&&(q+="="+cn(h[N])),a.push(q)}}return this.i=a.join("&")};function Qi(a){const c=new mr;return c.i=a.i,a.g&&(c.g=new Map(a.g),c.h=a.h),c}function gr(a,c){return c=String(c),a.j&&(c=c.toLowerCase()),c}function uc(a,c){c&&!a.j&&(An(a),a.i=null,a.g.forEach(function(h,g){const R=g.toLowerCase();g!=R&&(ho(this,g),Ba(this,R,h))},a)),a.j=c}function cc(a,c){const h=new Wi;if(o.Image){const g=new Image;g.onload=p($,h,"TestLoadImage: loaded",!0,c,g),g.onerror=p($,h,"TestLoadImage: error",!1,c,g),g.onabort=p($,h,"TestLoadImage: abort",!1,c,g),g.ontimeout=p($,h,"TestLoadImage: timeout",!1,c,g),o.setTimeout(function(){g.ontimeout&&g.ontimeout()},1e4),g.src=a}else c(!1)}function z(a,c){const h=new Wi,g=new AbortController,R=setTimeout(()=>{g.abort(),$(h,"TestPingServer: timeout",!1,c)},1e4);fetch(a,{signal:g.signal}).then(N=>{clearTimeout(R),N.ok?$(h,"TestPingServer: ok",!0,c):$(h,"TestPingServer: server error",!1,c)}).catch(()=>{clearTimeout(R),$(h,"TestPingServer: error",!1,c)})}function $(a,c,h,g,R){try{R&&(R.onload=null,R.onerror=null,R.onabort=null,R.ontimeout=null),g(h)}catch{}}function O(){this.g=new qi}function Z(a){this.i=a.Sb||null,this.h=a.ab||!1}m(Z,eo),Z.prototype.g=function(){return new W(this.i,this.h)};function W(a,c){et.call(this),this.H=a,this.o=c,this.m=void 0,this.status=this.readyState=0,this.responseType=this.responseText=this.response=this.statusText="",this.onreadystatechange=null,this.A=new Headers,this.h=null,this.F="GET",this.D="",this.g=!1,this.B=this.j=this.l=null,this.v=new AbortController}m(W,et),t=W.prototype,t.open=function(a,c){if(this.readyState!=0)throw this.abort(),Error("Error reopening a connection");this.F=a,this.D=c,this.readyState=1,Oe(this)},t.send=function(a){if(this.readyState!=1)throw this.abort(),Error("need to call open() first. ");if(this.v.signal.aborted)throw this.abort(),Error("Request was aborted.");this.g=!0;const c={headers:this.A,method:this.F,credentials:this.m,cache:void 0,signal:this.v.signal};a&&(c.body=a),(this.H||o).fetch(new Request(this.D,c)).then(this.Pa.bind(this),this.ga.bind(this))},t.abort=function(){this.response=this.responseText="",this.A=new Headers,this.status=0,this.v.abort(),this.j&&this.j.cancel("Request was aborted.").catch(()=>{}),this.readyState>=1&&this.g&&this.readyState!=4&&(this.g=!1,de(this)),this.readyState=0},t.Pa=function(a){if(this.g&&(this.l=a,this.h||(this.status=this.l.status,this.statusText=this.l.statusText,this.h=a.headers,this.readyState=2,Oe(this)),this.g&&(this.readyState=3,Oe(this),this.g)))if(this.responseType==="arraybuffer")a.arrayBuffer().then(this.Na.bind(this),this.ga.bind(this));else if(typeof o.ReadableStream<"u"&&"body"in a){if(this.j=a.body.getReader(),this.o){if(this.responseType)throw Error('responseType must be empty for "streamBinaryChunks" mode responses.');this.response=[]}else this.response=this.responseText="",this.B=new TextDecoder;ne(this)}else a.text().then(this.Oa.bind(this),this.ga.bind(this))};function ne(a){a.j.read().then(a.Ma.bind(a)).catch(a.ga.bind(a))}t.Ma=function(a){if(this.g){if(this.o&&a.value)this.response.push(a.value);else if(!this.o){var c=a.value?a.value:new Uint8Array(0);(c=this.B.decode(c,{stream:!a.done}))&&(this.response=this.responseText+=c)}a.done?de(this):Oe(this),this.readyState==3&&ne(this)}},t.Oa=function(a){this.g&&(this.response=this.responseText=a,de(this))},t.Na=function(a){this.g&&(this.response=a,de(this))},t.ga=function(){this.g&&de(this)};function de(a){a.readyState=4,a.l=null,a.j=null,a.B=null,Oe(a)}t.setRequestHeader=function(a,c){this.A.append(a,c)},t.getResponseHeader=function(a){return this.h&&this.h.get(a.toLowerCase())||""},t.getAllResponseHeaders=function(){if(!this.h)return"";const a=[],c=this.h.entries();for(var h=c.next();!h.done;)h=h.value,a.push(h[0]+": "+h[1]),h=c.next();return a.join(`\r
`)};function Oe(a){a.onreadystatechange&&a.onreadystatechange.call(a)}Object.defineProperty(W.prototype,"withCredentials",{get:function(){return this.m==="include"},set:function(a){this.m=a?"include":"same-origin"}});function rt(a){let c="";return Y(a,function(h,g){c+=g,c+=":",c+=h,c+=`\r
`}),c}function Qt(a,c,h){e:{for(g in h){var g=!1;break e}g=!0}g||(h=rt(h),typeof a=="string"?h!=null&&cn(h):ye(a,c,h))}function me(a){et.call(this),this.headers=new Map,this.L=a||null,this.h=!1,this.g=null,this.D="",this.o=0,this.l="",this.j=this.B=this.v=this.A=!1,this.m=null,this.F="",this.H=!1}m(me,et);var yr=/^https?$/i,Pe=["POST","PUT"];t=me.prototype,t.Fa=function(a){this.H=a},t.ea=function(a,c,h,g){if(this.g)throw Error("[goog.net.XhrIo] Object is active with another request="+this.D+"; newUri="+a);c=c?c.toUpperCase():"GET",this.D=a,this.l="",this.o=0,this.A=!1,this.h=!0,this.g=this.L?this.L.g():nt.g(),this.g.onreadystatechange=v(d(this.Ca,this));try{this.B=!0,this.g.open(c,String(a),!0),this.B=!1}catch(N){St(this,N);return}if(a=h||"",h=new Map(this.headers),g)if(Object.getPrototypeOf(g)===Object.prototype)for(var R in g)h.set(R,g[R]);else if(typeof g.keys=="function"&&typeof g.get=="function")for(const N of g.keys())h.set(N,g.get(N));else throw Error("Unknown input type for opt_headers: "+String(g));g=Array.from(h.keys()).find(N=>N.toLowerCase()=="content-type"),R=o.FormData&&a instanceof o.FormData,!(Array.prototype.indexOf.call(Pe,c,void 0)>=0)||g||R||h.set("Content-Type","application/x-www-form-urlencoded;charset=utf-8");for(const[N,q]of h)this.g.setRequestHeader(N,q);this.F&&(this.g.responseType=this.F),"withCredentials"in this.g&&this.g.withCredentials!==this.H&&(this.g.withCredentials=this.H);try{this.m&&(clearTimeout(this.m),this.m=null),this.v=!0,this.g.send(a),this.v=!1}catch(N){St(this,N)}};function St(a,c){a.h=!1,a.g&&(a.j=!0,a.g.abort(),a.j=!1),a.l=c,a.o=5,Yi(a),Yt(a)}function Yi(a){a.A||(a.A=!0,tt(a,"complete"),tt(a,"error"))}t.abort=function(a){this.g&&this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1,this.o=a||7,tt(this,"complete"),tt(this,"abort"),Yt(this))},t.N=function(){this.g&&(this.h&&(this.h=!1,this.j=!0,this.g.abort(),this.j=!1),Yt(this,!0)),me.Z.N.call(this)},t.Ca=function(){this.u||(this.B||this.v||this.j?Xi(this):this.Xa())},t.Xa=function(){Xi(this)};function Xi(a){if(a.h&&typeof s<"u"){if(a.v&&Xt(a)==4)setTimeout(a.Ca.bind(a),0);else if(tt(a,"readystatechange"),Xt(a)==4){a.h=!1;try{const N=a.ca();e:switch(N){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var c=!0;break e;default:c=!1}var h;if(!(h=c)){var g;if(g=N===0){let q=String(a.D).match(Kt)[1]||null;!q&&o.self&&o.self.location&&(q=o.self.location.protocol.slice(0,-1)),g=!yr.test(q?q.toLowerCase():"")}h=g}if(h)tt(a,"complete"),tt(a,"success");else{a.o=6;try{var R=Xt(a)>2?a.g.statusText:""}catch{R=""}a.l=R+" ["+a.ca()+"]",Yi(a)}}finally{Yt(a)}}}}function Yt(a,c){if(a.g){a.m&&(clearTimeout(a.m),a.m=null);const h=a.g;a.g=null,c||tt(a,"ready");try{h.onreadystatechange=null}catch{}}}t.isActive=function(){return!!this.g};function Xt(a){return a.g?a.g.readyState:0}t.ca=function(){try{return Xt(this)>2?this.g.status:-1}catch{return-1}},t.la=function(){try{return this.g?this.g.responseText:""}catch{return""}},t.La=function(a){if(this.g){var c=this.g.responseText;return a&&c.indexOf(a)==0&&(c=c.substring(a.length)),ar(c)}};function $a(a){try{if(!a.g)return null;if("response"in a.g)return a.g.response;switch(a.F){case"":case"text":return a.g.responseText;case"arraybuffer":if("mozResponseArrayBuffer"in a.g)return a.g.mozResponseArrayBuffer}return null}catch{return null}}function dc(a){const c={};a=(a.g&&Xt(a)>=2&&a.g.getAllResponseHeaders()||"").split(`\r
`);for(let g=0;g<a.length;g++){if(E(a[g]))continue;var h=cr(a[g]);const R=h[0];if(h=h[1],typeof h!="string")continue;h=h.trim();const N=c[R]||[];c[R]=N,N.push(h)}te(c,function(g){return g.join(", ")})}t.ya=function(){return this.o},t.Ha=function(){return typeof this.l=="string"?this.l:String(this.l)};function pi(a,c,h){return h&&h.internalChannelParams&&h.internalChannelParams[a]||c}function sp(a){this.za=0,this.i=[],this.j=new Wi,this.ba=this.na=this.J=this.W=this.g=this.wa=this.G=this.H=this.u=this.U=this.o=null,this.Ya=this.V=0,this.Sa=pi("failFast",!1,a),this.F=this.C=this.v=this.m=this.l=null,this.X=!0,this.xa=this.K=-1,this.Y=this.A=this.D=0,this.Qa=pi("baseRetryDelayMs",5e3,a),this.Za=pi("retryDelaySeedMs",1e4,a),this.Ta=pi("forwardChannelMaxRetries",2,a),this.va=pi("forwardChannelRequestTimeoutMs",2e4,a),this.ma=a&&a.xmlHttpFactory||void 0,this.Ua=a&&a.Rb||void 0,this.Aa=a&&a.useFetchStreams||!1,this.O=void 0,this.L=a&&a.supportsCrossDomainXhr||!1,this.M="",this.h=new ao(a&&a.concurrentRequestLimit),this.Ba=new O,this.S=a&&a.fastHandshake||!1,this.R=a&&a.encodeInitMessageHeaders||!1,this.S&&this.R&&(this.R=!1),this.Ra=a&&a.Pb||!1,a&&a.ua&&this.j.ua(),a&&a.forceLongPolling&&(this.X=!1),this.aa=!this.S&&this.X&&a&&a.detectBufferingProxy||!1,this.ia=void 0,a&&a.longPollingTimeout&&a.longPollingTimeout>0&&(this.ia=a.longPollingTimeout),this.ta=void 0,this.T=0,this.P=!1,this.ja=this.B=null}t=sp.prototype,t.ka=8,t.I=1,t.connect=function(a,c,h,g){Qe(0),this.W=a,this.H=c||{},h&&g!==void 0&&(this.H.OSID=h,this.H.OAID=g),this.F=this.X,this.J=pp(this,null,this.W),Ha(this)};function hc(a){if(op(a),a.I==3){var c=a.V++,h=je(a.J);if(ye(h,"SID",a.M),ye(h,"RID",c),ye(h,"TYPE","terminate"),fo(a,h),c=new Un(a,a.j,c),c.M=2,c.A=fi(je(h)),h=!1,o.navigator&&o.navigator.sendBeacon)try{h=o.navigator.sendBeacon(c.A.toString(),"")}catch{}!h&&o.Image&&(new Image().src=c.A,h=!0),h||(c.g=mp(c.j,null),c.g.ea(c.A)),c.F=Date.now(),Te(c)}fp(a)}function qa(a){a.g&&(pc(a),a.g.cancel(),a.g=null)}function op(a){qa(a),a.v&&(o.clearTimeout(a.v),a.v=null),Wa(a),a.h.cancel(),a.m&&(typeof a.m=="number"&&o.clearTimeout(a.m),a.m=null)}function Ha(a){if(!Rt(a.h)&&!a.m){a.m=!0;var c=a.Ea;F||y(),B||(F(),B=!0),w.add(c,a),a.D=0}}function h_(a,c){return di(a.h)>=a.h.j-(a.m?1:0)?!1:a.m?(a.i=c.G.concat(a.i),!0):a.I==1||a.I==2||a.D>=(a.Sa?0:a.Ta)?!1:(a.m=oi(d(a.Ea,a,c),hp(a,a.D)),a.D++,!0)}t.Ea=function(a){if(this.m)if(this.m=null,this.I==1){if(!a){this.V=Math.floor(Math.random()*1e5),a=this.V++;const R=new Un(this,this.j,a);let N=this.o;if(this.U&&(N?(N=we(N),Tn(N,this.U)):N=this.U),this.u!==null||this.R||(R.J=N,N=null),this.S)e:{for(var c=0,h=0;h<this.i.length;h++){t:{var g=this.i[h];if("__data__"in g.map&&(g=g.map.__data__,typeof g=="string")){g=g.length;break t}g=void 0}if(g===void 0)break;if(c+=g,c>4096){c=h;break e}if(c===4096||h===this.i.length-1){c=h+1;break e}}c=1e3}else c=1e3;c=lp(this,R,c),h=je(this.J),ye(h,"RID",a),ye(h,"CVER",22),this.G&&ye(h,"X-HTTP-Session-Id",this.G),fo(this,h),N&&(this.R?c="headers="+cn(rt(N))+"&"+c:this.u&&Qt(h,this.u,N)),hi(this.h,R),this.Ra&&ye(h,"TYPE","init"),this.S?(ye(h,"$req",c),ye(h,"SID","null"),R.U=!0,dr(R,h,null)):dr(R,h,c),this.I=2}}else this.I==3&&(a?ap(this,a):this.i.length==0||Rt(this.h)||ap(this))};function ap(a,c){var h;c?h=c.l:h=a.V++;const g=je(a.J);ye(g,"SID",a.M),ye(g,"RID",h),ye(g,"AID",a.K),fo(a,g),a.u&&a.o&&Qt(g,a.u,a.o),h=new Un(a,a.j,h,a.D+1),a.u===null&&(h.J=a.o),c&&(a.i=c.G.concat(a.i)),c=lp(a,h,1e3),h.H=Math.round(a.va*.5)+Math.round(a.va*.5*Math.random()),hi(a.h,h),dr(h,g,c)}function fo(a,c){a.H&&Y(a.H,function(h,g){ye(c,g,h)}),a.l&&Y({},function(h,g){ye(c,g,h)})}function lp(a,c,h){h=Math.min(a.i.length,h);const g=a.l?d(a.l.Ka,a.l,a):null;e:{var R=a.i;let se=-1;for(;;){const Ye=["count="+h];se==-1?h>0?(se=R[0].g,Ye.push("ofs="+se)):se=0:Ye.push("ofs="+se);let xe=!0;for(let it=0;it<h;it++){var N=R[it].g;const Cn=R[it].map;if(N-=se,N<0)se=Math.max(0,R[it].g-100),xe=!1;else try{N="req"+N+"_"||"";try{var q=Cn instanceof Map?Cn:Object.entries(Cn);for(const[gi,vr]of q){let _r=vr;l(vr)&&(_r=Sn(vr)),Ye.push(N+gi+"="+encodeURIComponent(_r))}}catch(gi){throw Ye.push(N+"type="+encodeURIComponent("_badmap")),gi}}catch{g&&g(Cn)}}if(xe){q=Ye.join("&");break e}}q=void 0}return a=a.i.splice(0,h),c.G=a,q}function up(a){if(!a.g&&!a.v){a.Y=1;var c=a.Da;F||y(),B||(F(),B=!0),w.add(c,a),a.A=0}}function fc(a){return a.g||a.v||a.A>=3?!1:(a.Y++,a.v=oi(d(a.Da,a),hp(a,a.A)),a.A++,!0)}t.Da=function(){if(this.v=null,cp(this),this.aa&&!(this.P||this.g==null||this.T<=0)){var a=4*this.T;this.j.info("BP detection timer enabled: "+a),this.B=oi(d(this.Wa,this),a)}},t.Wa=function(){this.B&&(this.B=null,this.j.info("BP detection timeout reached."),this.j.info("Buffering proxy detected and switch to long-polling!"),this.F=!1,this.P=!0,Qe(10),qa(this),cp(this))};function pc(a){a.B!=null&&(o.clearTimeout(a.B),a.B=null)}function cp(a){a.g=new Un(a,a.j,"rpc",a.Y),a.u===null&&(a.g.J=a.o),a.g.P=0;var c=je(a.na);ye(c,"RID","rpc"),ye(c,"SID",a.M),ye(c,"AID",a.K),ye(c,"CI",a.F?"0":"1"),!a.F&&a.ia&&ye(c,"TO",a.ia),ye(c,"TYPE","xmlhttp"),fo(a,c),a.u&&a.o&&Qt(c,a.u,a.o),a.O&&(a.g.H=a.O);var h=a.g;a=a.ba,h.M=1,h.A=fi(je(c)),h.u=null,h.R=!0,La(h,a)}t.Va=function(){this.C!=null&&(this.C=null,qa(this),fc(this),Qe(19))};function Wa(a){a.C!=null&&(o.clearTimeout(a.C),a.C=null)}function dp(a,c){var h=null;if(a.g==c){Wa(a),pc(a),a.g=null;var g=2}else if($e(a.h,c))h=c.G,$n(a.h,c),g=1;else return;if(a.I!=0){if(c.o)if(g==1){h=c.u?c.u.length:0,c=Date.now()-c.F;var R=a.D;g=ri(),tt(g,new io(g,h)),Ha(a)}else up(a);else if(R=c.m,R==3||R==0&&c.X>0||!(g==1&&h_(a,c)||g==2&&fc(a)))switch(h&&h.length>0&&(c=a.h,c.i=c.i.concat(h)),R){case 1:mi(a,5);break;case 4:mi(a,10);break;case 3:mi(a,6);break;default:mi(a,2)}}}function hp(a,c){let h=a.Qa+Math.floor(Math.random()*a.Za);return a.isActive()||(h*=2),h*c}function mi(a,c){if(a.j.info("Error code "+c),c==2){var h=d(a.bb,a),g=a.Ua;const R=!g;g=new Ae(g||"//www.google.com/images/cleardot.gif"),o.location&&o.location.protocol=="http"||dn(g,"https"),fi(g),R?cc(g.toString(),h):z(g.toString(),h)}else Qe(2);a.I=0,a.l&&a.l.pa(c),fp(a),op(a)}t.bb=function(a){a?(this.j.info("Successfully pinged google.com"),Qe(2)):(this.j.info("Failed to ping google.com"),Qe(1))};function fp(a){if(a.I=0,a.ja=[],a.l){const c=hr(a.h);(c.length!=0||a.i.length!=0)&&(A(a.ja,c),A(a.ja,a.i),a.h.i.length=0,I(a.i),a.i.length=0),a.l.oa()}}function pp(a,c,h){var g=h instanceof Ae?je(h):new Ae(h);if(g.g!="")c&&(g.g=c+"."+g.g),hn(g,g.u);else{var R=o.location;g=R.protocol,c=c?c+"."+R.hostname:R.hostname,R=+R.port;const N=new Ae(null);g&&dn(N,g),c&&(N.g=c),R&&hn(N,R),h&&(N.h=h),g=N}return h=a.G,c=a.wa,h&&c&&ye(g,h,c),ye(g,"VER",a.ka),fo(a,g),g}function mp(a,c,h){if(c&&!a.L)throw Error("Can't create secondary domain capable XhrIo object.");return c=a.Aa&&!a.ma?new me(new Z({ab:h})):new me(a.ma),c.Fa(a.L),c}t.isActive=function(){return!!this.l&&this.l.isActive(this)};function gp(){}t=gp.prototype,t.ra=function(){},t.qa=function(){},t.pa=function(){},t.oa=function(){},t.isActive=function(){return!0},t.Ka=function(){};function Ga(){}Ga.prototype.g=function(a,c){return new Ot(a,c)};function Ot(a,c){et.call(this),this.g=new sp(c),this.l=a,this.h=c&&c.messageUrlParams||null,a=c&&c.messageHeaders||null,c&&c.clientProtocolHeaderRequired&&(a?a["X-Client-Protocol"]="webchannel":a={"X-Client-Protocol":"webchannel"}),this.g.o=a,a=c&&c.initMessageHeaders||null,c&&c.messageContentType&&(a?a["X-WebChannel-Content-Type"]=c.messageContentType:a={"X-WebChannel-Content-Type":c.messageContentType}),c&&c.sa&&(a?a["X-WebChannel-Client-Profile"]=c.sa:a={"X-WebChannel-Client-Profile":c.sa}),this.g.U=a,(a=c&&c.Qb)&&!E(a)&&(this.g.u=a),this.A=c&&c.supportsCrossDomainXhr||!1,this.v=c&&c.sendRawJson||!1,(c=c&&c.httpSessionIdParam)&&!E(c)&&(this.g.G=c,a=this.h,a!==null&&c in a&&(a=this.h,c in a&&delete a[c])),this.j=new Ji(this)}m(Ot,et),Ot.prototype.m=function(){this.g.l=this.j,this.A&&(this.g.L=!0),this.g.connect(this.l,this.h||void 0)},Ot.prototype.close=function(){hc(this.g)},Ot.prototype.o=function(a){var c=this.g;if(typeof a=="string"){var h={};h.__data__=a,a=h}else this.v&&(h={},h.__data__=Sn(a),a=h);c.i.push(new Oa(c.Ya++,a)),c.I==3&&Ha(c)},Ot.prototype.N=function(){this.g.l=null,delete this.j,hc(this.g),delete this.g,Ot.Z.N.call(this)};function yp(a){Hi.call(this),a.__headers__&&(this.headers=a.__headers__,this.statusCode=a.__status__,delete a.__headers__,delete a.__status__);var c=a.__sm__;if(c){e:{for(const h in c){a=h;break e}a=void 0}(this.i=a)&&(a=this.i,c=c!==null&&a in c?c[a]:void 0),this.data=c}else this.data=a}m(yp,Hi);function vp(){no.call(this),this.status=1}m(vp,no);function Ji(a){this.g=a}m(Ji,gp),Ji.prototype.ra=function(){tt(this.g,"a")},Ji.prototype.qa=function(a){tt(this.g,new yp(a))},Ji.prototype.pa=function(a){tt(this.g,new vp)},Ji.prototype.oa=function(){tt(this.g,"b")},Ga.prototype.createWebChannel=Ga.prototype.g,Ot.prototype.send=Ot.prototype.o,Ot.prototype.open=Ot.prototype.m,Ot.prototype.close=Ot.prototype.close,Sv=function(){return new Ga},Tv=function(){return ri()},bv=kn,Xd={jb:0,mb:1,nb:2,Hb:3,Mb:4,Jb:5,Kb:6,Ib:7,Gb:8,Lb:9,PROXY:10,NOPROXY:11,Eb:12,Ab:13,Bb:14,zb:15,Cb:16,Db:17,fb:18,eb:19,gb:20},ur.NO_ERROR=0,ur.TIMEOUT=8,ur.HTTP_ERROR=6,Vl=ur,so.COMPLETE="complete",Ev=so,to.EventType=ni,ni.OPEN="a",ni.CLOSE="b",ni.ERROR="c",ni.MESSAGE="d",et.prototype.listen=et.prototype.J,Co=to,me.prototype.listenOnce=me.prototype.K,me.prototype.getLastError=me.prototype.Ha,me.prototype.getLastErrorCode=me.prototype.ya,me.prototype.getStatus=me.prototype.ca,me.prototype.getResponseJson=me.prototype.La,me.prototype.getResponseText=me.prototype.la,me.prototype.send=me.prototype.ea,me.prototype.setWithCredentials=me.prototype.Fa,xv=me}).apply(typeof hl<"u"?hl:typeof self<"u"?self:typeof window<"u"?window:{});/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _t{constructor(e){this.uid=e}isAuthenticated(){return this.uid!=null}toKey(){return this.isAuthenticated()?"uid:"+this.uid:"anonymous-user"}isEqual(e){return e.uid===this.uid}}_t.UNAUTHENTICATED=new _t(null),_t.GOOGLE_CREDENTIALS=new _t("google-credentials-uid"),_t.FIRST_PARTY=new _t("first-party-uid"),_t.MOCK_USER=new _t("mock-user");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let qs="12.12.0";function bE(t){qs=t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ni=new pv("@firebase/firestore");function es(){return Ni.logLevel}function K(t,...e){if(Ni.logLevel<=fe.DEBUG){const n=e.map(yf);Ni.debug(`Firestore (${qs}): ${t}`,...n)}}function nr(t,...e){if(Ni.logLevel<=fe.ERROR){const n=e.map(yf);Ni.error(`Firestore (${qs}): ${t}`,...n)}}function Vi(t,...e){if(Ni.logLevel<=fe.WARN){const n=e.map(yf);Ni.warn(`Firestore (${qs}): ${t}`,...n)}}function yf(t){if(typeof t=="string")return t;try{return function(n){return JSON.stringify(n)}(t)}catch{return t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ee(t,e,n){let r="Unexpected state";typeof e=="string"?r=e:n=e,kv(t,r,n)}function kv(t,e,n){let r=`FIRESTORE (${qs}) INTERNAL ASSERTION FAILED: ${e} (ID: ${t.toString(16)})`;if(n!==void 0)try{r+=" CONTEXT: "+JSON.stringify(n)}catch{r+=" CONTEXT: "+n}throw nr(r),new Error(r)}function ve(t,e,n,r){let i="Unexpected state";typeof n=="string"?i=n:r=n,t||kv(e,i,r)}function ie(t,e){return t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const L={OK:"ok",CANCELLED:"cancelled",UNKNOWN:"unknown",INVALID_ARGUMENT:"invalid-argument",DEADLINE_EXCEEDED:"deadline-exceeded",NOT_FOUND:"not-found",ALREADY_EXISTS:"already-exists",PERMISSION_DENIED:"permission-denied",UNAUTHENTICATED:"unauthenticated",RESOURCE_EXHAUSTED:"resource-exhausted",FAILED_PRECONDITION:"failed-precondition",ABORTED:"aborted",OUT_OF_RANGE:"out-of-range",UNIMPLEMENTED:"unimplemented",INTERNAL:"internal",UNAVAILABLE:"unavailable",DATA_LOSS:"data-loss"};class G extends $s{constructor(e,n){super(e,n),this.code=e,this.message=n,this.toString=()=>`${this.name}: [code=${this.code}]: ${this.message}`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zr{constructor(){this.promise=new Promise((e,n)=>{this.resolve=e,this.reject=n})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Iv{constructor(e,n){this.user=n,this.type="OAuth",this.headers=new Map,this.headers.set("Authorization",`Bearer ${e}`)}}class TE{getToken(){return Promise.resolve(null)}invalidateToken(){}start(e,n){e.enqueueRetryable(()=>n(_t.UNAUTHENTICATED))}shutdown(){}}class SE{constructor(e){this.token=e,this.changeListener=null}getToken(){return Promise.resolve(this.token)}invalidateToken(){}start(e,n){this.changeListener=n,e.enqueueRetryable(()=>n(this.token.user))}shutdown(){this.changeListener=null}}class kE{constructor(e){this.t=e,this.currentUser=_t.UNAUTHENTICATED,this.i=0,this.forceRefresh=!1,this.auth=null}start(e,n){ve(this.o===void 0,42304);let r=this.i;const i=u=>this.i!==r?(r=this.i,n(u)):Promise.resolve();let s=new zr;this.o=()=>{this.i++,this.currentUser=this.u(),s.resolve(),s=new zr,e.enqueueRetryable(()=>i(this.currentUser))};const o=()=>{const u=s;e.enqueueRetryable(async()=>{await u.promise,await i(this.currentUser)})},l=u=>{K("FirebaseAuthCredentialsProvider","Auth detected"),this.auth=u,this.o&&(this.auth.addAuthTokenListener(this.o),o())};this.t.onInit(u=>l(u)),setTimeout(()=>{if(!this.auth){const u=this.t.getImmediate({optional:!0});u?l(u):(K("FirebaseAuthCredentialsProvider","Auth not yet detected"),s.resolve(),s=new zr)}},0),o()}getToken(){const e=this.i,n=this.forceRefresh;return this.forceRefresh=!1,this.auth?this.auth.getToken(n).then(r=>this.i!==e?(K("FirebaseAuthCredentialsProvider","getToken aborted due to token change."),this.getToken()):r?(ve(typeof r.accessToken=="string",31837,{l:r}),new Iv(r.accessToken,this.currentUser)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.auth&&this.o&&this.auth.removeAuthTokenListener(this.o),this.o=void 0}u(){const e=this.auth&&this.auth.getUid();return ve(e===null||typeof e=="string",2055,{h:e}),new _t(e)}}class IE{constructor(e,n,r){this.P=e,this.T=n,this.I=r,this.type="FirstParty",this.user=_t.FIRST_PARTY,this.R=new Map}A(){return this.I?this.I():null}get headers(){this.R.set("X-Goog-AuthUser",this.P);const e=this.A();return e&&this.R.set("Authorization",e),this.T&&this.R.set("X-Goog-Iam-Authorization-Token",this.T),this.R}}class AE{constructor(e,n,r){this.P=e,this.T=n,this.I=r}getToken(){return Promise.resolve(new IE(this.P,this.T,this.I))}start(e,n){e.enqueueRetryable(()=>n(_t.FIRST_PARTY))}shutdown(){}invalidateToken(){}}class zm{constructor(e){this.value=e,this.type="AppCheck",this.headers=new Map,e&&e.length>0&&this.headers.set("x-firebase-appcheck",this.value)}}class CE{constructor(e,n){this.V=n,this.forceRefresh=!1,this.appCheck=null,this.m=null,this.p=null,oE(e)&&e.settings.appCheckToken&&(this.p=e.settings.appCheckToken)}start(e,n){ve(this.o===void 0,3512);const r=s=>{s.error!=null&&K("FirebaseAppCheckTokenProvider",`Error getting App Check token; using placeholder token instead. Error: ${s.error.message}`);const o=s.token!==this.m;return this.m=s.token,K("FirebaseAppCheckTokenProvider",`Received ${o?"new":"existing"} token.`),o?n(s.token):Promise.resolve()};this.o=s=>{e.enqueueRetryable(()=>r(s))};const i=s=>{K("FirebaseAppCheckTokenProvider","AppCheck detected"),this.appCheck=s,this.o&&this.appCheck.addTokenListener(this.o)};this.V.onInit(s=>i(s)),setTimeout(()=>{if(!this.appCheck){const s=this.V.getImmediate({optional:!0});s?i(s):K("FirebaseAppCheckTokenProvider","AppCheck not yet detected")}},0)}getToken(){if(this.p)return Promise.resolve(new zm(this.p));const e=this.forceRefresh;return this.forceRefresh=!1,this.appCheck?this.appCheck.getToken(e).then(n=>n?(ve(typeof n.token=="string",44558,{tokenResult:n}),this.m=n.token,new zm(n.token)):null):Promise.resolve(null)}invalidateToken(){this.forceRefresh=!0}shutdown(){this.appCheck&&this.o&&this.appCheck.removeTokenListener(this.o),this.o=void 0}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function RE(t){const e=typeof self<"u"&&(self.crypto||self.msCrypto),n=new Uint8Array(t);if(e&&typeof e.getRandomValues=="function")e.getRandomValues(n);else for(let r=0;r<t;r++)n[r]=Math.floor(256*Math.random());return n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vf{static newId(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",n=62*Math.floor(4.129032258064516);let r="";for(;r.length<20;){const i=RE(40);for(let s=0;s<i.length;++s)r.length<20&&i[s]<n&&(r+=e.charAt(i[s]%62))}return r}}function le(t,e){return t<e?-1:t>e?1:0}function Jd(t,e){const n=Math.min(t.length,e.length);for(let r=0;r<n;r++){const i=t.charAt(r),s=e.charAt(r);if(i!==s)return Wc(i)===Wc(s)?le(i,s):Wc(i)?1:-1}return le(t.length,e.length)}const PE=55296,NE=57343;function Wc(t){const e=t.charCodeAt(0);return e>=PE&&e<=NE}function Ms(t,e,n){return t.length===e.length&&t.every((r,i)=>n(r,e[i]))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Um="__name__";class Nn{constructor(e,n,r){n===void 0?n=0:n>e.length&&ee(637,{offset:n,range:e.length}),r===void 0?r=e.length-n:r>e.length-n&&ee(1746,{length:r,range:e.length-n}),this.segments=e,this.offset=n,this.len=r}get length(){return this.len}isEqual(e){return Nn.comparator(this,e)===0}child(e){const n=this.segments.slice(this.offset,this.limit());return e instanceof Nn?e.forEach(r=>{n.push(r)}):n.push(e),this.construct(n)}limit(){return this.offset+this.length}popFirst(e){return e=e===void 0?1:e,this.construct(this.segments,this.offset+e,this.length-e)}popLast(){return this.construct(this.segments,this.offset,this.length-1)}firstSegment(){return this.segments[this.offset]}lastSegment(){return this.get(this.length-1)}get(e){return this.segments[this.offset+e]}isEmpty(){return this.length===0}isPrefixOf(e){if(e.length<this.length)return!1;for(let n=0;n<this.length;n++)if(this.get(n)!==e.get(n))return!1;return!0}isImmediateParentOf(e){if(this.length+1!==e.length)return!1;for(let n=0;n<this.length;n++)if(this.get(n)!==e.get(n))return!1;return!0}forEach(e){for(let n=this.offset,r=this.limit();n<r;n++)e(this.segments[n])}toArray(){return this.segments.slice(this.offset,this.limit())}static comparator(e,n){const r=Math.min(e.length,n.length);for(let i=0;i<r;i++){const s=Nn.compareSegments(e.get(i),n.get(i));if(s!==0)return s}return le(e.length,n.length)}static compareSegments(e,n){const r=Nn.isNumericId(e),i=Nn.isNumericId(n);return r&&!i?-1:!r&&i?1:r&&i?Nn.extractNumericId(e).compare(Nn.extractNumericId(n)):Jd(e,n)}static isNumericId(e){return e.startsWith("__id")&&e.endsWith("__")}static extractNumericId(e){return Fr.fromString(e.substring(4,e.length-2))}}class Ee extends Nn{construct(e,n,r){return new Ee(e,n,r)}canonicalString(){return this.toArray().join("/")}toString(){return this.canonicalString()}toUriEncodedString(){return this.toArray().map(encodeURIComponent).join("/")}static fromString(...e){const n=[];for(const r of e){if(r.indexOf("//")>=0)throw new G(L.INVALID_ARGUMENT,`Invalid segment (${r}). Paths must not contain // in them.`);n.push(...r.split("/").filter(i=>i.length>0))}return new Ee(n)}static emptyPath(){return new Ee([])}}const VE=/^[_a-zA-Z][_a-zA-Z0-9]*$/;class ht extends Nn{construct(e,n,r){return new ht(e,n,r)}static isValidIdentifier(e){return VE.test(e)}canonicalString(){return this.toArray().map(e=>(e=e.replace(/\\/g,"\\\\").replace(/`/g,"\\`"),ht.isValidIdentifier(e)||(e="`"+e+"`"),e)).join(".")}toString(){return this.canonicalString()}isKeyField(){return this.length===1&&this.get(0)===Um}static keyField(){return new ht([Um])}static fromServerFormat(e){const n=[];let r="",i=0;const s=()=>{if(r.length===0)throw new G(L.INVALID_ARGUMENT,`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`);n.push(r),r=""};let o=!1;for(;i<e.length;){const l=e[i];if(l==="\\"){if(i+1===e.length)throw new G(L.INVALID_ARGUMENT,"Path has trailing escape character: "+e);const u=e[i+1];if(u!=="\\"&&u!=="."&&u!=="`")throw new G(L.INVALID_ARGUMENT,"Path has invalid escape sequence: "+e);r+=u,i+=2}else l==="`"?(o=!o,i++):l!=="."||o?(r+=l,i++):(s(),i++)}if(s(),o)throw new G(L.INVALID_ARGUMENT,"Unterminated ` in path: "+e);return new ht(n)}static emptyPath(){return new ht([])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class X{constructor(e){this.path=e}static fromPath(e){return new X(Ee.fromString(e))}static fromName(e){return new X(Ee.fromString(e).popFirst(5))}static empty(){return new X(Ee.emptyPath())}get collectionGroup(){return this.path.popLast().lastSegment()}hasCollectionId(e){return this.path.length>=2&&this.path.get(this.path.length-2)===e}getCollectionGroup(){return this.path.get(this.path.length-2)}getCollectionPath(){return this.path.popLast()}isEqual(e){return e!==null&&Ee.comparator(this.path,e.path)===0}toString(){return this.path.toString()}static comparator(e,n){return Ee.comparator(e.path,n.path)}static isDocumentKey(e){return e.length%2==0}static fromSegments(e){return new X(new Ee(e.slice()))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Av(t,e,n){if(!n)throw new G(L.INVALID_ARGUMENT,`Function ${t}() cannot be called with an empty ${e}.`)}function DE(t,e,n,r){if(e===!0&&r===!0)throw new G(L.INVALID_ARGUMENT,`${t} and ${n} cannot be used together.`)}function Bm(t){if(!X.isDocumentKey(t))throw new G(L.INVALID_ARGUMENT,`Invalid document reference. Document references must have an even number of segments, but ${t} has ${t.length}.`)}function $m(t){if(X.isDocumentKey(t))throw new G(L.INVALID_ARGUMENT,`Invalid collection reference. Collection references must have an odd number of segments, but ${t} has ${t.length}.`)}function Cv(t){return typeof t=="object"&&t!==null&&(Object.getPrototypeOf(t)===Object.prototype||Object.getPrototypeOf(t)===null)}function $u(t){if(t===void 0)return"undefined";if(t===null)return"null";if(typeof t=="string")return t.length>20&&(t=`${t.substring(0,20)}...`),JSON.stringify(t);if(typeof t=="number"||typeof t=="boolean")return""+t;if(typeof t=="object"){if(t instanceof Array)return"an array";{const e=function(r){return r.constructor?r.constructor.name:null}(t);return e?`a custom ${e} object`:"an object"}}return typeof t=="function"?"a function":ee(12329,{type:typeof t})}function hu(t,e){if("_delegate"in t&&(t=t._delegate),!(t instanceof e)){if(e.name===t.constructor.name)throw new G(L.INVALID_ARGUMENT,"Type does not match the expected instance. Did you pass a reference from a different Firestore SDK?");{const n=$u(t);throw new G(L.INVALID_ARGUMENT,`Expected type '${e.name}', but it was: ${n}`)}}return t}function ME(t,e){if(e<=0)throw new G(L.INVALID_ARGUMENT,`Function ${t}() requires a positive number, but it was: ${e}.`)}/**
 * @license
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ge(t,e){const n={typeString:t};return e&&(n.value=e),n}function Ia(t,e){if(!Cv(t))throw new G(L.INVALID_ARGUMENT,"JSON must be an object");let n;for(const r in e)if(e[r]){const i=e[r].typeString,s="value"in e[r]?{value:e[r].value}:void 0;if(!(r in t)){n=`JSON missing required field: '${r}'`;break}const o=t[r];if(i&&typeof o!==i){n=`JSON field '${r}' must be a ${i}.`;break}if(s!==void 0&&o!==s.value){n=`Expected '${r}' field to equal '${s.value}'`;break}}if(n)throw new G(L.INVALID_ARGUMENT,n);return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qm=-62135596800,Hm=1e6;class ke{static now(){return ke.fromMillis(Date.now())}static fromDate(e){return ke.fromMillis(e.getTime())}static fromMillis(e){const n=Math.floor(e/1e3),r=Math.floor((e-1e3*n)*Hm);return new ke(n,r)}constructor(e,n){if(this.seconds=e,this.nanoseconds=n,n<0)throw new G(L.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+n);if(n>=1e9)throw new G(L.INVALID_ARGUMENT,"Timestamp nanoseconds out of range: "+n);if(e<qm)throw new G(L.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e);if(e>=253402300800)throw new G(L.INVALID_ARGUMENT,"Timestamp seconds out of range: "+e)}toDate(){return new Date(this.toMillis())}toMillis(){return 1e3*this.seconds+this.nanoseconds/Hm}_compareTo(e){return this.seconds===e.seconds?le(this.nanoseconds,e.nanoseconds):le(this.seconds,e.seconds)}isEqual(e){return e.seconds===this.seconds&&e.nanoseconds===this.nanoseconds}toString(){return"Timestamp(seconds="+this.seconds+", nanoseconds="+this.nanoseconds+")"}toJSON(){return{type:ke._jsonSchemaVersion,seconds:this.seconds,nanoseconds:this.nanoseconds}}static fromJSON(e){if(Ia(e,ke._jsonSchema))return new ke(e.seconds,e.nanoseconds)}valueOf(){const e=this.seconds-qm;return String(e).padStart(12,"0")+"."+String(this.nanoseconds).padStart(9,"0")}}ke._jsonSchemaVersion="firestore/timestamp/1.0",ke._jsonSchema={type:Ge("string",ke._jsonSchemaVersion),seconds:Ge("number"),nanoseconds:Ge("number")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class re{static fromTimestamp(e){return new re(e)}static min(){return new re(new ke(0,0))}static max(){return new re(new ke(253402300799,999999999))}constructor(e){this.timestamp=e}compareTo(e){return this.timestamp._compareTo(e.timestamp)}isEqual(e){return this.timestamp.isEqual(e.timestamp)}toMicroseconds(){return 1e6*this.timestamp.seconds+this.timestamp.nanoseconds/1e3}toString(){return"SnapshotVersion("+this.timestamp.toString()+")"}toTimestamp(){return this.timestamp}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fa=-1;function LE(t,e){const n=t.toTimestamp().seconds,r=t.toTimestamp().nanoseconds+1,i=re.fromTimestamp(r===1e9?new ke(n+1,0):new ke(n,r));return new qr(i,X.empty(),e)}function jE(t){return new qr(t.readTime,t.key,fa)}class qr{constructor(e,n,r){this.readTime=e,this.documentKey=n,this.largestBatchId=r}static min(){return new qr(re.min(),X.empty(),fa)}static max(){return new qr(re.max(),X.empty(),fa)}}function OE(t,e){let n=t.readTime.compareTo(e.readTime);return n!==0?n:(n=X.comparator(t.documentKey,e.documentKey),n!==0?n:le(t.largestBatchId,e.largestBatchId))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const FE="The current tab is not in the required state to perform this operation. It might be necessary to refresh the browser tab.";class zE{constructor(){this.onCommittedListeners=[]}addOnCommittedListener(e){this.onCommittedListeners.push(e)}raiseOnCommittedEvent(){this.onCommittedListeners.forEach(e=>e())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Hs(t){if(t.code!==L.FAILED_PRECONDITION||t.message!==FE)throw t;K("LocalStore","Unexpectedly lost primary lease")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class j{constructor(e){this.nextCallback=null,this.catchCallback=null,this.result=void 0,this.error=void 0,this.isDone=!1,this.callbackAttached=!1,e(n=>{this.isDone=!0,this.result=n,this.nextCallback&&this.nextCallback(n)},n=>{this.isDone=!0,this.error=n,this.catchCallback&&this.catchCallback(n)})}catch(e){return this.next(void 0,e)}next(e,n){return this.callbackAttached&&ee(59440),this.callbackAttached=!0,this.isDone?this.error?this.wrapFailure(n,this.error):this.wrapSuccess(e,this.result):new j((r,i)=>{this.nextCallback=s=>{this.wrapSuccess(e,s).next(r,i)},this.catchCallback=s=>{this.wrapFailure(n,s).next(r,i)}})}toPromise(){return new Promise((e,n)=>{this.next(e,n)})}wrapUserFunction(e){try{const n=e();return n instanceof j?n:j.resolve(n)}catch(n){return j.reject(n)}}wrapSuccess(e,n){return e?this.wrapUserFunction(()=>e(n)):j.resolve(n)}wrapFailure(e,n){return e?this.wrapUserFunction(()=>e(n)):j.reject(n)}static resolve(e){return new j((n,r)=>{n(e)})}static reject(e){return new j((n,r)=>{r(e)})}static waitFor(e){return new j((n,r)=>{let i=0,s=0,o=!1;e.forEach(l=>{++i,l.next(()=>{++s,o&&s===i&&n()},u=>r(u))}),o=!0,s===i&&n()})}static or(e){let n=j.resolve(!1);for(const r of e)n=n.next(i=>i?j.resolve(i):r());return n}static forEach(e,n){const r=[];return e.forEach((i,s)=>{r.push(n.call(this,i,s))}),this.waitFor(r)}static mapArray(e,n){return new j((r,i)=>{const s=e.length,o=new Array(s);let l=0;for(let u=0;u<s;u++){const d=u;n(e[d]).next(p=>{o[d]=p,++l,l===s&&r(o)},p=>i(p))}})}static doWhile(e,n){return new j((r,i)=>{const s=()=>{e()===!0?n().next(()=>{s()},i):r()};s()})}}function UE(t){const e=t.match(/Android ([\d.]+)/i),n=e?e[1].split(".").slice(0,2).join("."):"-1";return Number(n)}function Ws(t){return t.name==="IndexedDbTransactionError"}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qu{constructor(e,n){this.previousValue=e,n&&(n.sequenceNumberHandler=r=>this.ae(r),this.ue=r=>n.writeSequenceNumber(r))}ae(e){return this.previousValue=Math.max(e,this.previousValue),this.previousValue}next(){const e=++this.previousValue;return this.ue&&this.ue(e),e}}qu.ce=-1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _f=-1;function Hu(t){return t==null}function fu(t){return t===0&&1/t==-1/0}function BE(t){return typeof t=="number"&&Number.isInteger(t)&&!fu(t)&&t<=Number.MAX_SAFE_INTEGER&&t>=Number.MIN_SAFE_INTEGER}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rv="";function $E(t){let e="";for(let n=0;n<t.length;n++)e.length>0&&(e=Wm(e)),e=qE(t.get(n),e);return Wm(e)}function qE(t,e){let n=e;const r=t.length;for(let i=0;i<r;i++){const s=t.charAt(i);switch(s){case"\0":n+="";break;case Rv:n+="";break;default:n+=s}}return n}function Wm(t){return t+Rv+""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gm(t){let e=0;for(const n in t)Object.prototype.hasOwnProperty.call(t,n)&&e++;return e}function ji(t,e){for(const n in t)Object.prototype.hasOwnProperty.call(t,n)&&e(n,t[n])}function Pv(t){for(const e in t)if(Object.prototype.hasOwnProperty.call(t,e))return!1;return!0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Me{constructor(e,n){this.comparator=e,this.root=n||dt.EMPTY}insert(e,n){return new Me(this.comparator,this.root.insert(e,n,this.comparator).copy(null,null,dt.BLACK,null,null))}remove(e){return new Me(this.comparator,this.root.remove(e,this.comparator).copy(null,null,dt.BLACK,null,null))}get(e){let n=this.root;for(;!n.isEmpty();){const r=this.comparator(e,n.key);if(r===0)return n.value;r<0?n=n.left:r>0&&(n=n.right)}return null}indexOf(e){let n=0,r=this.root;for(;!r.isEmpty();){const i=this.comparator(e,r.key);if(i===0)return n+r.left.size;i<0?r=r.left:(n+=r.left.size+1,r=r.right)}return-1}isEmpty(){return this.root.isEmpty()}get size(){return this.root.size}minKey(){return this.root.minKey()}maxKey(){return this.root.maxKey()}inorderTraversal(e){return this.root.inorderTraversal(e)}forEach(e){this.inorderTraversal((n,r)=>(e(n,r),!1))}toString(){const e=[];return this.inorderTraversal((n,r)=>(e.push(`${n}:${r}`),!1)),`{${e.join(", ")}}`}reverseTraversal(e){return this.root.reverseTraversal(e)}getIterator(){return new fl(this.root,null,this.comparator,!1)}getIteratorFrom(e){return new fl(this.root,e,this.comparator,!1)}getReverseIterator(){return new fl(this.root,null,this.comparator,!0)}getReverseIteratorFrom(e){return new fl(this.root,e,this.comparator,!0)}}class fl{constructor(e,n,r,i){this.isReverse=i,this.nodeStack=[];let s=1;for(;!e.isEmpty();)if(s=n?r(e.key,n):1,n&&i&&(s*=-1),s<0)e=this.isReverse?e.left:e.right;else{if(s===0){this.nodeStack.push(e);break}this.nodeStack.push(e),e=this.isReverse?e.right:e.left}}getNext(){let e=this.nodeStack.pop();const n={key:e.key,value:e.value};if(this.isReverse)for(e=e.left;!e.isEmpty();)this.nodeStack.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack.push(e),e=e.left;return n}hasNext(){return this.nodeStack.length>0}peek(){if(this.nodeStack.length===0)return null;const e=this.nodeStack[this.nodeStack.length-1];return{key:e.key,value:e.value}}}class dt{constructor(e,n,r,i,s){this.key=e,this.value=n,this.color=r??dt.RED,this.left=i??dt.EMPTY,this.right=s??dt.EMPTY,this.size=this.left.size+1+this.right.size}copy(e,n,r,i,s){return new dt(e??this.key,n??this.value,r??this.color,i??this.left,s??this.right)}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min(){return this.left.isEmpty()?this:this.left.min()}minKey(){return this.min().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,n,r){let i=this;const s=r(e,i.key);return i=s<0?i.copy(null,null,null,i.left.insert(e,n,r),null):s===0?i.copy(null,n,null,null,null):i.copy(null,null,null,null,i.right.insert(e,n,r)),i.fixUp()}removeMin(){if(this.left.isEmpty())return dt.EMPTY;let e=this;return e.left.isRed()||e.left.left.isRed()||(e=e.moveRedLeft()),e=e.copy(null,null,null,e.left.removeMin(),null),e.fixUp()}remove(e,n){let r,i=this;if(n(e,i.key)<0)i.left.isEmpty()||i.left.isRed()||i.left.left.isRed()||(i=i.moveRedLeft()),i=i.copy(null,null,null,i.left.remove(e,n),null);else{if(i.left.isRed()&&(i=i.rotateRight()),i.right.isEmpty()||i.right.isRed()||i.right.left.isRed()||(i=i.moveRedRight()),n(e,i.key)===0){if(i.right.isEmpty())return dt.EMPTY;r=i.right.min(),i=i.copy(r.key,r.value,null,null,i.right.removeMin())}i=i.copy(null,null,null,null,i.right.remove(e,n))}return i.fixUp()}isRed(){return this.color}fixUp(){let e=this;return e.right.isRed()&&!e.left.isRed()&&(e=e.rotateLeft()),e.left.isRed()&&e.left.left.isRed()&&(e=e.rotateRight()),e.left.isRed()&&e.right.isRed()&&(e=e.colorFlip()),e}moveRedLeft(){let e=this.colorFlip();return e.right.left.isRed()&&(e=e.copy(null,null,null,null,e.right.rotateRight()),e=e.rotateLeft(),e=e.colorFlip()),e}moveRedRight(){let e=this.colorFlip();return e.left.left.isRed()&&(e=e.rotateRight(),e=e.colorFlip()),e}rotateLeft(){const e=this.copy(null,null,dt.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight(){const e=this.copy(null,null,dt.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip(){const e=this.left.copy(null,null,!this.left.color,null,null),n=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,n)}checkMaxDepth(){const e=this.check();return Math.pow(2,e)<=this.size+1}check(){if(this.isRed()&&this.left.isRed())throw ee(43730,{key:this.key,value:this.value});if(this.right.isRed())throw ee(14113,{key:this.key,value:this.value});const e=this.left.check();if(e!==this.right.check())throw ee(27949);return e+(this.isRed()?0:1)}}dt.EMPTY=null,dt.RED=!0,dt.BLACK=!1;dt.EMPTY=new class{constructor(){this.size=0}get key(){throw ee(57766)}get value(){throw ee(16141)}get color(){throw ee(16727)}get left(){throw ee(29726)}get right(){throw ee(36894)}copy(e,n,r,i,s){return this}insert(e,n,r){return new dt(e,n)}remove(e,n){return this}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}isRed(){return!1}checkMaxDepth(){return!0}check(){return 0}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ze{constructor(e){this.comparator=e,this.data=new Me(this.comparator)}has(e){return this.data.get(e)!==null}first(){return this.data.minKey()}last(){return this.data.maxKey()}get size(){return this.data.size}indexOf(e){return this.data.indexOf(e)}forEach(e){this.data.inorderTraversal((n,r)=>(e(n),!1))}forEachInRange(e,n){const r=this.data.getIteratorFrom(e[0]);for(;r.hasNext();){const i=r.getNext();if(this.comparator(i.key,e[1])>=0)return;n(i.key)}}forEachWhile(e,n){let r;for(r=n!==void 0?this.data.getIteratorFrom(n):this.data.getIterator();r.hasNext();)if(!e(r.getNext().key))return}firstAfterOrEqual(e){const n=this.data.getIteratorFrom(e);return n.hasNext()?n.getNext().key:null}getIterator(){return new Km(this.data.getIterator())}getIteratorFrom(e){return new Km(this.data.getIteratorFrom(e))}add(e){return this.copy(this.data.remove(e).insert(e,!0))}delete(e){return this.has(e)?this.copy(this.data.remove(e)):this}isEmpty(){return this.data.isEmpty()}unionWith(e){let n=this;return n.size<e.size&&(n=e,e=this),e.forEach(r=>{n=n.add(r)}),n}isEqual(e){if(!(e instanceof Ze)||this.size!==e.size)return!1;const n=this.data.getIterator(),r=e.data.getIterator();for(;n.hasNext();){const i=n.getNext().key,s=r.getNext().key;if(this.comparator(i,s)!==0)return!1}return!0}toArray(){const e=[];return this.forEach(n=>{e.push(n)}),e}toString(){const e=[];return this.forEach(n=>e.push(n)),"SortedSet("+e.toString()+")"}copy(e){const n=new Ze(this.comparator);return n.data=e,n}}class Km{constructor(e){this.iter=e}getNext(){return this.iter.getNext().key}hasNext(){return this.iter.hasNext()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vn{constructor(e){this.fields=e,e.sort(ht.comparator)}static empty(){return new vn([])}unionWith(e){let n=new Ze(ht.comparator);for(const r of this.fields)n=n.add(r);for(const r of e)n=n.add(r);return new vn(n.toArray())}covers(e){for(const n of this.fields)if(n.isPrefixOf(e))return!0;return!1}isEqual(e){return Ms(this.fields,e.fields,(n,r)=>n.isEqual(r))}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Nv extends Error{constructor(){super(...arguments),this.name="Base64DecodeError"}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mt{constructor(e){this.binaryString=e}static fromBase64String(e){const n=function(i){try{return atob(i)}catch(s){throw typeof DOMException<"u"&&s instanceof DOMException?new Nv("Invalid base64 string: "+s):s}}(e);return new mt(n)}static fromUint8Array(e){const n=function(i){let s="";for(let o=0;o<i.length;++o)s+=String.fromCharCode(i[o]);return s}(e);return new mt(n)}[Symbol.iterator](){let e=0;return{next:()=>e<this.binaryString.length?{value:this.binaryString.charCodeAt(e++),done:!1}:{value:void 0,done:!0}}}toBase64(){return function(n){return btoa(n)}(this.binaryString)}toUint8Array(){return function(n){const r=new Uint8Array(n.length);for(let i=0;i<n.length;i++)r[i]=n.charCodeAt(i);return r}(this.binaryString)}approximateByteSize(){return 2*this.binaryString.length}compareTo(e){return le(this.binaryString,e.binaryString)}isEqual(e){return this.binaryString===e.binaryString}}mt.EMPTY_BYTE_STRING=new mt("");const HE=new RegExp(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.(\d+))?Z$/);function Hr(t){if(ve(!!t,39018),typeof t=="string"){let e=0;const n=HE.exec(t);if(ve(!!n,46558,{timestamp:t}),n[1]){let i=n[1];i=(i+"000000000").substr(0,9),e=Number(i)}const r=new Date(t);return{seconds:Math.floor(r.getTime()/1e3),nanos:e}}return{seconds:Ue(t.seconds),nanos:Ue(t.nanos)}}function Ue(t){return typeof t=="number"?t:typeof t=="string"?Number(t):0}function Wr(t){return typeof t=="string"?mt.fromBase64String(t):mt.fromUint8Array(t)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vv="server_timestamp",Dv="__type__",Mv="__previous_value__",Lv="__local_write_time__";function wf(t){var n,r;return((r=(((n=t==null?void 0:t.mapValue)==null?void 0:n.fields)||{})[Dv])==null?void 0:r.stringValue)===Vv}function Wu(t){const e=t.mapValue.fields[Mv];return wf(e)?Wu(e):e}function pa(t){const e=Hr(t.mapValue.fields[Lv].timestampValue);return new ke(e.seconds,e.nanos)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class WE{constructor(e,n,r,i,s,o,l,u,d,p,m){this.databaseId=e,this.appId=n,this.persistenceKey=r,this.host=i,this.ssl=s,this.forceLongPolling=o,this.autoDetectLongPolling=l,this.longPollingOptions=u,this.useFetchStreams=d,this.isUsingEmulator=p,this.apiKey=m}}const pu="(default)";class ma{constructor(e,n){this.projectId=e,this.database=n||pu}static empty(){return new ma("","")}get isDefaultDatabase(){return this.database===pu}isEqual(e){return e instanceof ma&&e.projectId===this.projectId&&e.database===this.database}}function GE(t,e){if(!Object.prototype.hasOwnProperty.apply(t.options,["projectId"]))throw new G(L.INVALID_ARGUMENT,'"projectId" not provided in firebase.initializeApp.');return new ma(t.options.projectId,e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jv="__type__",KE="__max__",pl={mapValue:{}},Ov="__vector__",mu="value";function Gr(t){return"nullValue"in t?0:"booleanValue"in t?1:"integerValue"in t||"doubleValue"in t?2:"timestampValue"in t?3:"stringValue"in t?5:"bytesValue"in t?6:"referenceValue"in t?7:"geoPointValue"in t?8:"arrayValue"in t?9:"mapValue"in t?wf(t)?4:YE(t)?9007199254740991:QE(t)?10:11:ee(28295,{value:t})}function zn(t,e){if(t===e)return!0;const n=Gr(t);if(n!==Gr(e))return!1;switch(n){case 0:case 9007199254740991:return!0;case 1:return t.booleanValue===e.booleanValue;case 4:return pa(t).isEqual(pa(e));case 3:return function(i,s){if(typeof i.timestampValue=="string"&&typeof s.timestampValue=="string"&&i.timestampValue.length===s.timestampValue.length)return i.timestampValue===s.timestampValue;const o=Hr(i.timestampValue),l=Hr(s.timestampValue);return o.seconds===l.seconds&&o.nanos===l.nanos}(t,e);case 5:return t.stringValue===e.stringValue;case 6:return function(i,s){return Wr(i.bytesValue).isEqual(Wr(s.bytesValue))}(t,e);case 7:return t.referenceValue===e.referenceValue;case 8:return function(i,s){return Ue(i.geoPointValue.latitude)===Ue(s.geoPointValue.latitude)&&Ue(i.geoPointValue.longitude)===Ue(s.geoPointValue.longitude)}(t,e);case 2:return function(i,s){if("integerValue"in i&&"integerValue"in s)return Ue(i.integerValue)===Ue(s.integerValue);if("doubleValue"in i&&"doubleValue"in s){const o=Ue(i.doubleValue),l=Ue(s.doubleValue);return o===l?fu(o)===fu(l):isNaN(o)&&isNaN(l)}return!1}(t,e);case 9:return Ms(t.arrayValue.values||[],e.arrayValue.values||[],zn);case 10:case 11:return function(i,s){const o=i.mapValue.fields||{},l=s.mapValue.fields||{};if(Gm(o)!==Gm(l))return!1;for(const u in o)if(o.hasOwnProperty(u)&&(l[u]===void 0||!zn(o[u],l[u])))return!1;return!0}(t,e);default:return ee(52216,{left:t})}}function ga(t,e){return(t.values||[]).find(n=>zn(n,e))!==void 0}function Ls(t,e){if(t===e)return 0;const n=Gr(t),r=Gr(e);if(n!==r)return le(n,r);switch(n){case 0:case 9007199254740991:return 0;case 1:return le(t.booleanValue,e.booleanValue);case 2:return function(s,o){const l=Ue(s.integerValue||s.doubleValue),u=Ue(o.integerValue||o.doubleValue);return l<u?-1:l>u?1:l===u?0:isNaN(l)?isNaN(u)?0:-1:1}(t,e);case 3:return Qm(t.timestampValue,e.timestampValue);case 4:return Qm(pa(t),pa(e));case 5:return Jd(t.stringValue,e.stringValue);case 6:return function(s,o){const l=Wr(s),u=Wr(o);return l.compareTo(u)}(t.bytesValue,e.bytesValue);case 7:return function(s,o){const l=s.split("/"),u=o.split("/");for(let d=0;d<l.length&&d<u.length;d++){const p=le(l[d],u[d]);if(p!==0)return p}return le(l.length,u.length)}(t.referenceValue,e.referenceValue);case 8:return function(s,o){const l=le(Ue(s.latitude),Ue(o.latitude));return l!==0?l:le(Ue(s.longitude),Ue(o.longitude))}(t.geoPointValue,e.geoPointValue);case 9:return Ym(t.arrayValue,e.arrayValue);case 10:return function(s,o){var v,I,A,P;const l=s.fields||{},u=o.fields||{},d=(v=l[mu])==null?void 0:v.arrayValue,p=(I=u[mu])==null?void 0:I.arrayValue,m=le(((A=d==null?void 0:d.values)==null?void 0:A.length)||0,((P=p==null?void 0:p.values)==null?void 0:P.length)||0);return m!==0?m:Ym(d,p)}(t.mapValue,e.mapValue);case 11:return function(s,o){if(s===pl.mapValue&&o===pl.mapValue)return 0;if(s===pl.mapValue)return 1;if(o===pl.mapValue)return-1;const l=s.fields||{},u=Object.keys(l),d=o.fields||{},p=Object.keys(d);u.sort(),p.sort();for(let m=0;m<u.length&&m<p.length;++m){const v=Jd(u[m],p[m]);if(v!==0)return v;const I=Ls(l[u[m]],d[p[m]]);if(I!==0)return I}return le(u.length,p.length)}(t.mapValue,e.mapValue);default:throw ee(23264,{he:n})}}function Qm(t,e){if(typeof t=="string"&&typeof e=="string"&&t.length===e.length)return le(t,e);const n=Hr(t),r=Hr(e),i=le(n.seconds,r.seconds);return i!==0?i:le(n.nanos,r.nanos)}function Ym(t,e){const n=t.values||[],r=e.values||[];for(let i=0;i<n.length&&i<r.length;++i){const s=Ls(n[i],r[i]);if(s)return s}return le(n.length,r.length)}function js(t){return Zd(t)}function Zd(t){return"nullValue"in t?"null":"booleanValue"in t?""+t.booleanValue:"integerValue"in t?""+t.integerValue:"doubleValue"in t?""+t.doubleValue:"timestampValue"in t?function(n){const r=Hr(n);return`time(${r.seconds},${r.nanos})`}(t.timestampValue):"stringValue"in t?t.stringValue:"bytesValue"in t?function(n){return Wr(n).toBase64()}(t.bytesValue):"referenceValue"in t?function(n){return X.fromName(n).toString()}(t.referenceValue):"geoPointValue"in t?function(n){return`geo(${n.latitude},${n.longitude})`}(t.geoPointValue):"arrayValue"in t?function(n){let r="[",i=!0;for(const s of n.values||[])i?i=!1:r+=",",r+=Zd(s);return r+"]"}(t.arrayValue):"mapValue"in t?function(n){const r=Object.keys(n.fields||{}).sort();let i="{",s=!0;for(const o of r)s?s=!1:i+=",",i+=`${o}:${Zd(n.fields[o])}`;return i+"}"}(t.mapValue):ee(61005,{value:t})}function Dl(t){switch(Gr(t)){case 0:case 1:return 4;case 2:return 8;case 3:case 8:return 16;case 4:const e=Wu(t);return e?16+Dl(e):16;case 5:return 2*t.stringValue.length;case 6:return Wr(t.bytesValue).approximateByteSize();case 7:return t.referenceValue.length;case 9:return function(r){return(r.values||[]).reduce((i,s)=>i+Dl(s),0)}(t.arrayValue);case 10:case 11:return function(r){let i=0;return ji(r.fields,(s,o)=>{i+=s.length+Dl(o)}),i}(t.mapValue);default:throw ee(13486,{value:t})}}function Xm(t,e){return{referenceValue:`projects/${t.projectId}/databases/${t.database}/documents/${e.path.canonicalString()}`}}function eh(t){return!!t&&"integerValue"in t}function xf(t){return!!t&&"arrayValue"in t}function Jm(t){return!!t&&"nullValue"in t}function Zm(t){return!!t&&"doubleValue"in t&&isNaN(Number(t.doubleValue))}function Ml(t){return!!t&&"mapValue"in t}function QE(t){var n,r;return((r=(((n=t==null?void 0:t.mapValue)==null?void 0:n.fields)||{})[jv])==null?void 0:r.stringValue)===Ov}function Bo(t){if(t.geoPointValue)return{geoPointValue:{...t.geoPointValue}};if(t.timestampValue&&typeof t.timestampValue=="object")return{timestampValue:{...t.timestampValue}};if(t.mapValue){const e={mapValue:{fields:{}}};return ji(t.mapValue.fields,(n,r)=>e.mapValue.fields[n]=Bo(r)),e}if(t.arrayValue){const e={arrayValue:{values:[]}};for(let n=0;n<(t.arrayValue.values||[]).length;++n)e.arrayValue.values[n]=Bo(t.arrayValue.values[n]);return e}return{...t}}function YE(t){return(((t.mapValue||{}).fields||{}).__type__||{}).stringValue===KE}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class nn{constructor(e){this.value=e}static empty(){return new nn({mapValue:{}})}field(e){if(e.isEmpty())return this.value;{let n=this.value;for(let r=0;r<e.length-1;++r)if(n=(n.mapValue.fields||{})[e.get(r)],!Ml(n))return null;return n=(n.mapValue.fields||{})[e.lastSegment()],n||null}}set(e,n){this.getFieldsMap(e.popLast())[e.lastSegment()]=Bo(n)}setAll(e){let n=ht.emptyPath(),r={},i=[];e.forEach((o,l)=>{if(!n.isImmediateParentOf(l)){const u=this.getFieldsMap(n);this.applyChanges(u,r,i),r={},i=[],n=l.popLast()}o?r[l.lastSegment()]=Bo(o):i.push(l.lastSegment())});const s=this.getFieldsMap(n);this.applyChanges(s,r,i)}delete(e){const n=this.field(e.popLast());Ml(n)&&n.mapValue.fields&&delete n.mapValue.fields[e.lastSegment()]}isEqual(e){return zn(this.value,e.value)}getFieldsMap(e){let n=this.value;n.mapValue.fields||(n.mapValue={fields:{}});for(let r=0;r<e.length;++r){let i=n.mapValue.fields[e.get(r)];Ml(i)&&i.mapValue.fields||(i={mapValue:{fields:{}}},n.mapValue.fields[e.get(r)]=i),n=i}return n.mapValue.fields}applyChanges(e,n,r){ji(n,(i,s)=>e[i]=s);for(const i of r)delete e[i]}clone(){return new nn(Bo(this.value))}}function Fv(t){const e=[];return ji(t.fields,(n,r)=>{const i=new ht([n]);if(Ml(r)){const s=Fv(r.mapValue).fields;if(s.length===0)e.push(i);else for(const o of s)e.push(i.child(o))}else e.push(i)}),new vn(e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xt{constructor(e,n,r,i,s,o,l){this.key=e,this.documentType=n,this.version=r,this.readTime=i,this.createTime=s,this.data=o,this.documentState=l}static newInvalidDocument(e){return new xt(e,0,re.min(),re.min(),re.min(),nn.empty(),0)}static newFoundDocument(e,n,r,i){return new xt(e,1,n,re.min(),r,i,0)}static newNoDocument(e,n){return new xt(e,2,n,re.min(),re.min(),nn.empty(),0)}static newUnknownDocument(e,n){return new xt(e,3,n,re.min(),re.min(),nn.empty(),2)}convertToFoundDocument(e,n){return!this.createTime.isEqual(re.min())||this.documentType!==2&&this.documentType!==0||(this.createTime=e),this.version=e,this.documentType=1,this.data=n,this.documentState=0,this}convertToNoDocument(e){return this.version=e,this.documentType=2,this.data=nn.empty(),this.documentState=0,this}convertToUnknownDocument(e){return this.version=e,this.documentType=3,this.data=nn.empty(),this.documentState=2,this}setHasCommittedMutations(){return this.documentState=2,this}setHasLocalMutations(){return this.documentState=1,this.version=re.min(),this}setReadTime(e){return this.readTime=e,this}get hasLocalMutations(){return this.documentState===1}get hasCommittedMutations(){return this.documentState===2}get hasPendingWrites(){return this.hasLocalMutations||this.hasCommittedMutations}isValidDocument(){return this.documentType!==0}isFoundDocument(){return this.documentType===1}isNoDocument(){return this.documentType===2}isUnknownDocument(){return this.documentType===3}isEqual(e){return e instanceof xt&&this.key.isEqual(e.key)&&this.version.isEqual(e.version)&&this.documentType===e.documentType&&this.documentState===e.documentState&&this.data.isEqual(e.data)}mutableCopy(){return new xt(this.key,this.documentType,this.version,this.readTime,this.createTime,this.data.clone(),this.documentState)}toString(){return`Document(${this.key}, ${this.version}, ${JSON.stringify(this.data.value)}, {createTime: ${this.createTime}}), {documentType: ${this.documentType}}), {documentState: ${this.documentState}})`}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gu{constructor(e,n){this.position=e,this.inclusive=n}}function eg(t,e,n){let r=0;for(let i=0;i<t.position.length;i++){const s=e[i],o=t.position[i];if(s.field.isKeyField()?r=X.comparator(X.fromName(o.referenceValue),n.key):r=Ls(o,n.data.field(s.field)),s.dir==="desc"&&(r*=-1),r!==0)break}return r}function tg(t,e){if(t===null)return e===null;if(e===null||t.inclusive!==e.inclusive||t.position.length!==e.position.length)return!1;for(let n=0;n<t.position.length;n++)if(!zn(t.position[n],e.position[n]))return!1;return!0}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ya{constructor(e,n="asc"){this.field=e,this.dir=n}}function XE(t,e){return t.dir===e.dir&&t.field.isEqual(e.field)}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class zv{}class We extends zv{constructor(e,n,r){super(),this.field=e,this.op=n,this.value=r}static create(e,n,r){return e.isKeyField()?n==="in"||n==="not-in"?this.createKeyFieldInFilter(e,n,r):new ZE(e,n,r):n==="array-contains"?new nb(e,r):n==="in"?new rb(e,r):n==="not-in"?new ib(e,r):n==="array-contains-any"?new sb(e,r):new We(e,n,r)}static createKeyFieldInFilter(e,n,r){return n==="in"?new eb(e,r):new tb(e,r)}matches(e){const n=e.data.field(this.field);return this.op==="!="?n!==null&&n.nullValue===void 0&&this.matchesComparison(Ls(n,this.value)):n!==null&&Gr(this.value)===Gr(n)&&this.matchesComparison(Ls(n,this.value))}matchesComparison(e){switch(this.op){case"<":return e<0;case"<=":return e<=0;case"==":return e===0;case"!=":return e!==0;case">":return e>0;case">=":return e>=0;default:return ee(47266,{operator:this.op})}}isInequality(){return["<","<=",">",">=","!=","not-in"].indexOf(this.op)>=0}getFlattenedFilters(){return[this]}getFilters(){return[this]}}class bn extends zv{constructor(e,n){super(),this.filters=e,this.op=n,this.Pe=null}static create(e,n){return new bn(e,n)}matches(e){return Uv(this)?this.filters.find(n=>!n.matches(e))===void 0:this.filters.find(n=>n.matches(e))!==void 0}getFlattenedFilters(){return this.Pe!==null||(this.Pe=this.filters.reduce((e,n)=>e.concat(n.getFlattenedFilters()),[])),this.Pe}getFilters(){return Object.assign([],this.filters)}}function Uv(t){return t.op==="and"}function Bv(t){return JE(t)&&Uv(t)}function JE(t){for(const e of t.filters)if(e instanceof bn)return!1;return!0}function th(t){if(t instanceof We)return t.field.canonicalString()+t.op.toString()+js(t.value);if(Bv(t))return t.filters.map(e=>th(e)).join(",");{const e=t.filters.map(n=>th(n)).join(",");return`${t.op}(${e})`}}function $v(t,e){return t instanceof We?function(r,i){return i instanceof We&&r.op===i.op&&r.field.isEqual(i.field)&&zn(r.value,i.value)}(t,e):t instanceof bn?function(r,i){return i instanceof bn&&r.op===i.op&&r.filters.length===i.filters.length?r.filters.reduce((s,o,l)=>s&&$v(o,i.filters[l]),!0):!1}(t,e):void ee(19439)}function qv(t){return t instanceof We?function(n){return`${n.field.canonicalString()} ${n.op} ${js(n.value)}`}(t):t instanceof bn?function(n){return n.op.toString()+" {"+n.getFilters().map(qv).join(" ,")+"}"}(t):"Filter"}class ZE extends We{constructor(e,n,r){super(e,n,r),this.key=X.fromName(r.referenceValue)}matches(e){const n=X.comparator(e.key,this.key);return this.matchesComparison(n)}}class eb extends We{constructor(e,n){super(e,"in",n),this.keys=Hv("in",n)}matches(e){return this.keys.some(n=>n.isEqual(e.key))}}class tb extends We{constructor(e,n){super(e,"not-in",n),this.keys=Hv("not-in",n)}matches(e){return!this.keys.some(n=>n.isEqual(e.key))}}function Hv(t,e){var n;return(((n=e.arrayValue)==null?void 0:n.values)||[]).map(r=>X.fromName(r.referenceValue))}class nb extends We{constructor(e,n){super(e,"array-contains",n)}matches(e){const n=e.data.field(this.field);return xf(n)&&ga(n.arrayValue,this.value)}}class rb extends We{constructor(e,n){super(e,"in",n)}matches(e){const n=e.data.field(this.field);return n!==null&&ga(this.value.arrayValue,n)}}class ib extends We{constructor(e,n){super(e,"not-in",n)}matches(e){if(ga(this.value.arrayValue,{nullValue:"NULL_VALUE"}))return!1;const n=e.data.field(this.field);return n!==null&&n.nullValue===void 0&&!ga(this.value.arrayValue,n)}}class sb extends We{constructor(e,n){super(e,"array-contains-any",n)}matches(e){const n=e.data.field(this.field);return!(!xf(n)||!n.arrayValue.values)&&n.arrayValue.values.some(r=>ga(this.value.arrayValue,r))}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ob{constructor(e,n=null,r=[],i=[],s=null,o=null,l=null){this.path=e,this.collectionGroup=n,this.orderBy=r,this.filters=i,this.limit=s,this.startAt=o,this.endAt=l,this.Te=null}}function ng(t,e=null,n=[],r=[],i=null,s=null,o=null){return new ob(t,e,n,r,i,s,o)}function Ef(t){const e=ie(t);if(e.Te===null){let n=e.path.canonicalString();e.collectionGroup!==null&&(n+="|cg:"+e.collectionGroup),n+="|f:",n+=e.filters.map(r=>th(r)).join(","),n+="|ob:",n+=e.orderBy.map(r=>function(s){return s.field.canonicalString()+s.dir}(r)).join(","),Hu(e.limit)||(n+="|l:",n+=e.limit),e.startAt&&(n+="|lb:",n+=e.startAt.inclusive?"b:":"a:",n+=e.startAt.position.map(r=>js(r)).join(",")),e.endAt&&(n+="|ub:",n+=e.endAt.inclusive?"a:":"b:",n+=e.endAt.position.map(r=>js(r)).join(",")),e.Te=n}return e.Te}function bf(t,e){if(t.limit!==e.limit||t.orderBy.length!==e.orderBy.length)return!1;for(let n=0;n<t.orderBy.length;n++)if(!XE(t.orderBy[n],e.orderBy[n]))return!1;if(t.filters.length!==e.filters.length)return!1;for(let n=0;n<t.filters.length;n++)if(!$v(t.filters[n],e.filters[n]))return!1;return t.collectionGroup===e.collectionGroup&&!!t.path.isEqual(e.path)&&!!tg(t.startAt,e.startAt)&&tg(t.endAt,e.endAt)}function nh(t){return X.isDocumentKey(t.path)&&t.collectionGroup===null&&t.filters.length===0}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gs{constructor(e,n=null,r=[],i=[],s=null,o="F",l=null,u=null){this.path=e,this.collectionGroup=n,this.explicitOrderBy=r,this.filters=i,this.limit=s,this.limitType=o,this.startAt=l,this.endAt=u,this.Ee=null,this.Ie=null,this.Re=null,this.startAt,this.endAt}}function ab(t,e,n,r,i,s,o,l){return new Gs(t,e,n,r,i,s,o,l)}function Wv(t){return new Gs(t)}function rg(t){return t.filters.length===0&&t.limit===null&&t.startAt==null&&t.endAt==null&&(t.explicitOrderBy.length===0||t.explicitOrderBy.length===1&&t.explicitOrderBy[0].field.isKeyField())}function lb(t){return X.isDocumentKey(t.path)&&t.collectionGroup===null&&t.filters.length===0}function Gv(t){return t.collectionGroup!==null}function $o(t){const e=ie(t);if(e.Ee===null){e.Ee=[];const n=new Set;for(const s of e.explicitOrderBy)e.Ee.push(s),n.add(s.field.canonicalString());const r=e.explicitOrderBy.length>0?e.explicitOrderBy[e.explicitOrderBy.length-1].dir:"asc";(function(o){let l=new Ze(ht.comparator);return o.filters.forEach(u=>{u.getFlattenedFilters().forEach(d=>{d.isInequality()&&(l=l.add(d.field))})}),l})(e).forEach(s=>{n.has(s.canonicalString())||s.isKeyField()||e.Ee.push(new ya(s,r))}),n.has(ht.keyField().canonicalString())||e.Ee.push(new ya(ht.keyField(),r))}return e.Ee}function jn(t){const e=ie(t);return e.Ie||(e.Ie=ub(e,$o(t))),e.Ie}function ub(t,e){if(t.limitType==="F")return ng(t.path,t.collectionGroup,e,t.filters,t.limit,t.startAt,t.endAt);{e=e.map(i=>{const s=i.dir==="desc"?"asc":"desc";return new ya(i.field,s)});const n=t.endAt?new gu(t.endAt.position,t.endAt.inclusive):null,r=t.startAt?new gu(t.startAt.position,t.startAt.inclusive):null;return ng(t.path,t.collectionGroup,e,t.filters,t.limit,n,r)}}function rh(t,e){const n=t.filters.concat([e]);return new Gs(t.path,t.collectionGroup,t.explicitOrderBy.slice(),n,t.limit,t.limitType,t.startAt,t.endAt)}function cb(t,e){const n=t.explicitOrderBy.concat([e]);return new Gs(t.path,t.collectionGroup,n,t.filters.slice(),t.limit,t.limitType,t.startAt,t.endAt)}function yu(t,e,n){return new Gs(t.path,t.collectionGroup,t.explicitOrderBy.slice(),t.filters.slice(),e,n,t.startAt,t.endAt)}function Gu(t,e){return bf(jn(t),jn(e))&&t.limitType===e.limitType}function Kv(t){return`${Ef(jn(t))}|lt:${t.limitType}`}function ts(t){return`Query(target=${function(n){let r=n.path.canonicalString();return n.collectionGroup!==null&&(r+=" collectionGroup="+n.collectionGroup),n.filters.length>0&&(r+=`, filters: [${n.filters.map(i=>qv(i)).join(", ")}]`),Hu(n.limit)||(r+=", limit: "+n.limit),n.orderBy.length>0&&(r+=`, orderBy: [${n.orderBy.map(i=>function(o){return`${o.field.canonicalString()} (${o.dir})`}(i)).join(", ")}]`),n.startAt&&(r+=", startAt: ",r+=n.startAt.inclusive?"b:":"a:",r+=n.startAt.position.map(i=>js(i)).join(",")),n.endAt&&(r+=", endAt: ",r+=n.endAt.inclusive?"a:":"b:",r+=n.endAt.position.map(i=>js(i)).join(",")),`Target(${r})`}(jn(t))}; limitType=${t.limitType})`}function Ku(t,e){return e.isFoundDocument()&&function(r,i){const s=i.key.path;return r.collectionGroup!==null?i.key.hasCollectionId(r.collectionGroup)&&r.path.isPrefixOf(s):X.isDocumentKey(r.path)?r.path.isEqual(s):r.path.isImmediateParentOf(s)}(t,e)&&function(r,i){for(const s of $o(r))if(!s.field.isKeyField()&&i.data.field(s.field)===null)return!1;return!0}(t,e)&&function(r,i){for(const s of r.filters)if(!s.matches(i))return!1;return!0}(t,e)&&function(r,i){return!(r.startAt&&!function(o,l,u){const d=eg(o,l,u);return o.inclusive?d<=0:d<0}(r.startAt,$o(r),i)||r.endAt&&!function(o,l,u){const d=eg(o,l,u);return o.inclusive?d>=0:d>0}(r.endAt,$o(r),i))}(t,e)}function db(t){return t.collectionGroup||(t.path.length%2==1?t.path.lastSegment():t.path.get(t.path.length-2))}function Qv(t){return(e,n)=>{let r=!1;for(const i of $o(t)){const s=hb(i,e,n);if(s!==0)return s;r=r||i.field.isKeyField()}return 0}}function hb(t,e,n){const r=t.field.isKeyField()?X.comparator(e.key,n.key):function(s,o,l){const u=o.data.field(s),d=l.data.field(s);return u!==null&&d!==null?Ls(u,d):ee(42886)}(t.field,e,n);switch(t.dir){case"asc":return r;case"desc":return-1*r;default:return ee(19790,{direction:t.dir})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Oi{constructor(e,n){this.mapKeyFn=e,this.equalsFn=n,this.inner={},this.innerSize=0}get(e){const n=this.mapKeyFn(e),r=this.inner[n];if(r!==void 0){for(const[i,s]of r)if(this.equalsFn(i,e))return s}}has(e){return this.get(e)!==void 0}set(e,n){const r=this.mapKeyFn(e),i=this.inner[r];if(i===void 0)return this.inner[r]=[[e,n]],void this.innerSize++;for(let s=0;s<i.length;s++)if(this.equalsFn(i[s][0],e))return void(i[s]=[e,n]);i.push([e,n]),this.innerSize++}delete(e){const n=this.mapKeyFn(e),r=this.inner[n];if(r===void 0)return!1;for(let i=0;i<r.length;i++)if(this.equalsFn(r[i][0],e))return r.length===1?delete this.inner[n]:r.splice(i,1),this.innerSize--,!0;return!1}forEach(e){ji(this.inner,(n,r)=>{for(const[i,s]of r)e(i,s)})}isEmpty(){return Pv(this.inner)}size(){return this.innerSize}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fb=new Me(X.comparator);function rr(){return fb}const Yv=new Me(X.comparator);function Ro(...t){let e=Yv;for(const n of t)e=e.insert(n.key,n);return e}function Xv(t){let e=Yv;return t.forEach((n,r)=>e=e.insert(n,r.overlayedDocument)),e}function bi(){return qo()}function Jv(){return qo()}function qo(){return new Oi(t=>t.toString(),(t,e)=>t.isEqual(e))}const pb=new Me(X.comparator),mb=new Ze(X.comparator);function ue(...t){let e=mb;for(const n of t)e=e.add(n);return e}const gb=new Ze(le);function yb(){return gb}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Tf(t,e){if(t.useProto3Json){if(isNaN(e))return{doubleValue:"NaN"};if(e===1/0)return{doubleValue:"Infinity"};if(e===-1/0)return{doubleValue:"-Infinity"}}return{doubleValue:fu(e)?"-0":e}}function Zv(t){return{integerValue:""+t}}function vb(t,e){return BE(e)?Zv(e):Tf(t,e)}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qu{constructor(){this._=void 0}}function _b(t,e,n){return t instanceof va?function(i,s){const o={fields:{[Dv]:{stringValue:Vv},[Lv]:{timestampValue:{seconds:i.seconds,nanos:i.nanoseconds}}}};return s&&wf(s)&&(s=Wu(s)),s&&(o.fields[Mv]=s),{mapValue:o}}(n,e):t instanceof _a?t1(t,e):t instanceof wa?n1(t,e):function(i,s){const o=e1(i,s),l=ig(o)+ig(i.Ae);return eh(o)&&eh(i.Ae)?Zv(l):Tf(i.serializer,l)}(t,e)}function wb(t,e,n){return t instanceof _a?t1(t,e):t instanceof wa?n1(t,e):n}function e1(t,e){return t instanceof vu?function(r){return eh(r)||function(s){return!!s&&"doubleValue"in s}(r)}(e)?e:{integerValue:0}:null}class va extends Qu{}class _a extends Qu{constructor(e){super(),this.elements=e}}function t1(t,e){const n=r1(e);for(const r of t.elements)n.some(i=>zn(i,r))||n.push(r);return{arrayValue:{values:n}}}class wa extends Qu{constructor(e){super(),this.elements=e}}function n1(t,e){let n=r1(e);for(const r of t.elements)n=n.filter(i=>!zn(i,r));return{arrayValue:{values:n}}}class vu extends Qu{constructor(e,n){super(),this.serializer=e,this.Ae=n}}function ig(t){return Ue(t.integerValue||t.doubleValue)}function r1(t){return xf(t)&&t.arrayValue.values?t.arrayValue.values.slice():[]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xb{constructor(e,n){this.field=e,this.transform=n}}function Eb(t,e){return t.field.isEqual(e.field)&&function(r,i){return r instanceof _a&&i instanceof _a||r instanceof wa&&i instanceof wa?Ms(r.elements,i.elements,zn):r instanceof vu&&i instanceof vu?zn(r.Ae,i.Ae):r instanceof va&&i instanceof va}(t.transform,e.transform)}class bb{constructor(e,n){this.version=e,this.transformResults=n}}class Yn{constructor(e,n){this.updateTime=e,this.exists=n}static none(){return new Yn}static exists(e){return new Yn(void 0,e)}static updateTime(e){return new Yn(e)}get isNone(){return this.updateTime===void 0&&this.exists===void 0}isEqual(e){return this.exists===e.exists&&(this.updateTime?!!e.updateTime&&this.updateTime.isEqual(e.updateTime):!e.updateTime)}}function Ll(t,e){return t.updateTime!==void 0?e.isFoundDocument()&&e.version.isEqual(t.updateTime):t.exists===void 0||t.exists===e.isFoundDocument()}class Yu{}function i1(t,e){if(!t.hasLocalMutations||e&&e.fields.length===0)return null;if(e===null)return t.isNoDocument()?new o1(t.key,Yn.none()):new Aa(t.key,t.data,Yn.none());{const n=t.data,r=nn.empty();let i=new Ze(ht.comparator);for(let s of e.fields)if(!i.has(s)){let o=n.field(s);o===null&&s.length>1&&(s=s.popLast(),o=n.field(s)),o===null?r.delete(s):r.set(s,o),i=i.add(s)}return new Fi(t.key,r,new vn(i.toArray()),Yn.none())}}function Tb(t,e,n){t instanceof Aa?function(i,s,o){const l=i.value.clone(),u=og(i.fieldTransforms,s,o.transformResults);l.setAll(u),s.convertToFoundDocument(o.version,l).setHasCommittedMutations()}(t,e,n):t instanceof Fi?function(i,s,o){if(!Ll(i.precondition,s))return void s.convertToUnknownDocument(o.version);const l=og(i.fieldTransforms,s,o.transformResults),u=s.data;u.setAll(s1(i)),u.setAll(l),s.convertToFoundDocument(o.version,u).setHasCommittedMutations()}(t,e,n):function(i,s,o){s.convertToNoDocument(o.version).setHasCommittedMutations()}(0,e,n)}function Ho(t,e,n,r){return t instanceof Aa?function(s,o,l,u){if(!Ll(s.precondition,o))return l;const d=s.value.clone(),p=ag(s.fieldTransforms,u,o);return d.setAll(p),o.convertToFoundDocument(o.version,d).setHasLocalMutations(),null}(t,e,n,r):t instanceof Fi?function(s,o,l,u){if(!Ll(s.precondition,o))return l;const d=ag(s.fieldTransforms,u,o),p=o.data;return p.setAll(s1(s)),p.setAll(d),o.convertToFoundDocument(o.version,p).setHasLocalMutations(),l===null?null:l.unionWith(s.fieldMask.fields).unionWith(s.fieldTransforms.map(m=>m.field))}(t,e,n,r):function(s,o,l){return Ll(s.precondition,o)?(o.convertToNoDocument(o.version).setHasLocalMutations(),null):l}(t,e,n)}function Sb(t,e){let n=null;for(const r of t.fieldTransforms){const i=e.data.field(r.field),s=e1(r.transform,i||null);s!=null&&(n===null&&(n=nn.empty()),n.set(r.field,s))}return n||null}function sg(t,e){return t.type===e.type&&!!t.key.isEqual(e.key)&&!!t.precondition.isEqual(e.precondition)&&!!function(r,i){return r===void 0&&i===void 0||!(!r||!i)&&Ms(r,i,(s,o)=>Eb(s,o))}(t.fieldTransforms,e.fieldTransforms)&&(t.type===0?t.value.isEqual(e.value):t.type!==1||t.data.isEqual(e.data)&&t.fieldMask.isEqual(e.fieldMask))}class Aa extends Yu{constructor(e,n,r,i=[]){super(),this.key=e,this.value=n,this.precondition=r,this.fieldTransforms=i,this.type=0}getFieldMask(){return null}}class Fi extends Yu{constructor(e,n,r,i,s=[]){super(),this.key=e,this.data=n,this.fieldMask=r,this.precondition=i,this.fieldTransforms=s,this.type=1}getFieldMask(){return this.fieldMask}}function s1(t){const e=new Map;return t.fieldMask.fields.forEach(n=>{if(!n.isEmpty()){const r=t.data.field(n);e.set(n,r)}}),e}function og(t,e,n){const r=new Map;ve(t.length===n.length,32656,{Ve:n.length,de:t.length});for(let i=0;i<n.length;i++){const s=t[i],o=s.transform,l=e.data.field(s.field);r.set(s.field,wb(o,l,n[i]))}return r}function ag(t,e,n){const r=new Map;for(const i of t){const s=i.transform,o=n.data.field(i.field);r.set(i.field,_b(s,o,e))}return r}class o1 extends Yu{constructor(e,n){super(),this.key=e,this.precondition=n,this.type=2,this.fieldTransforms=[]}getFieldMask(){return null}}class kb extends Yu{constructor(e,n){super(),this.key=e,this.precondition=n,this.type=3,this.fieldTransforms=[]}getFieldMask(){return null}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ib{constructor(e,n,r,i){this.batchId=e,this.localWriteTime=n,this.baseMutations=r,this.mutations=i}applyToRemoteDocument(e,n){const r=n.mutationResults;for(let i=0;i<this.mutations.length;i++){const s=this.mutations[i];s.key.isEqual(e.key)&&Tb(s,e,r[i])}}applyToLocalView(e,n){for(const r of this.baseMutations)r.key.isEqual(e.key)&&(n=Ho(r,e,n,this.localWriteTime));for(const r of this.mutations)r.key.isEqual(e.key)&&(n=Ho(r,e,n,this.localWriteTime));return n}applyToLocalDocumentSet(e,n){const r=Jv();return this.mutations.forEach(i=>{const s=e.get(i.key),o=s.overlayedDocument;let l=this.applyToLocalView(o,s.mutatedFields);l=n.has(i.key)?null:l;const u=i1(o,l);u!==null&&r.set(i.key,u),o.isValidDocument()||o.convertToNoDocument(re.min())}),r}keys(){return this.mutations.reduce((e,n)=>e.add(n.key),ue())}isEqual(e){return this.batchId===e.batchId&&Ms(this.mutations,e.mutations,(n,r)=>sg(n,r))&&Ms(this.baseMutations,e.baseMutations,(n,r)=>sg(n,r))}}class Sf{constructor(e,n,r,i){this.batch=e,this.commitVersion=n,this.mutationResults=r,this.docVersions=i}static from(e,n,r){ve(e.mutations.length===r.length,58842,{me:e.mutations.length,fe:r.length});let i=function(){return pb}();const s=e.mutations;for(let o=0;o<s.length;o++)i=i.insert(s[o].key,r[o].version);return new Sf(e,n,r,i)}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ab{constructor(e,n){this.largestBatchId=e,this.mutation=n}getKey(){return this.mutation.key}isEqual(e){return e!==null&&this.mutation===e.mutation}toString(){return`Overlay{
      largestBatchId: ${this.largestBatchId},
      mutation: ${this.mutation.toString()}
    }`}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Cb{constructor(e,n){this.count=e,this.unchangedNames=n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var qe,he;function Rb(t){switch(t){case L.OK:return ee(64938);case L.CANCELLED:case L.UNKNOWN:case L.DEADLINE_EXCEEDED:case L.RESOURCE_EXHAUSTED:case L.INTERNAL:case L.UNAVAILABLE:case L.UNAUTHENTICATED:return!1;case L.INVALID_ARGUMENT:case L.NOT_FOUND:case L.ALREADY_EXISTS:case L.PERMISSION_DENIED:case L.FAILED_PRECONDITION:case L.ABORTED:case L.OUT_OF_RANGE:case L.UNIMPLEMENTED:case L.DATA_LOSS:return!0;default:return ee(15467,{code:t})}}function a1(t){if(t===void 0)return nr("GRPC error has no .code"),L.UNKNOWN;switch(t){case qe.OK:return L.OK;case qe.CANCELLED:return L.CANCELLED;case qe.UNKNOWN:return L.UNKNOWN;case qe.DEADLINE_EXCEEDED:return L.DEADLINE_EXCEEDED;case qe.RESOURCE_EXHAUSTED:return L.RESOURCE_EXHAUSTED;case qe.INTERNAL:return L.INTERNAL;case qe.UNAVAILABLE:return L.UNAVAILABLE;case qe.UNAUTHENTICATED:return L.UNAUTHENTICATED;case qe.INVALID_ARGUMENT:return L.INVALID_ARGUMENT;case qe.NOT_FOUND:return L.NOT_FOUND;case qe.ALREADY_EXISTS:return L.ALREADY_EXISTS;case qe.PERMISSION_DENIED:return L.PERMISSION_DENIED;case qe.FAILED_PRECONDITION:return L.FAILED_PRECONDITION;case qe.ABORTED:return L.ABORTED;case qe.OUT_OF_RANGE:return L.OUT_OF_RANGE;case qe.UNIMPLEMENTED:return L.UNIMPLEMENTED;case qe.DATA_LOSS:return L.DATA_LOSS;default:return ee(39323,{code:t})}}(he=qe||(qe={}))[he.OK=0]="OK",he[he.CANCELLED=1]="CANCELLED",he[he.UNKNOWN=2]="UNKNOWN",he[he.INVALID_ARGUMENT=3]="INVALID_ARGUMENT",he[he.DEADLINE_EXCEEDED=4]="DEADLINE_EXCEEDED",he[he.NOT_FOUND=5]="NOT_FOUND",he[he.ALREADY_EXISTS=6]="ALREADY_EXISTS",he[he.PERMISSION_DENIED=7]="PERMISSION_DENIED",he[he.UNAUTHENTICATED=16]="UNAUTHENTICATED",he[he.RESOURCE_EXHAUSTED=8]="RESOURCE_EXHAUSTED",he[he.FAILED_PRECONDITION=9]="FAILED_PRECONDITION",he[he.ABORTED=10]="ABORTED",he[he.OUT_OF_RANGE=11]="OUT_OF_RANGE",he[he.UNIMPLEMENTED=12]="UNIMPLEMENTED",he[he.INTERNAL=13]="INTERNAL",he[he.UNAVAILABLE=14]="UNAVAILABLE",he[he.DATA_LOSS=15]="DATA_LOSS";/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pb(){return new TextEncoder}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Nb=new Fr([4294967295,4294967295],0);function lg(t){const e=Pb().encode(t),n=new wv;return n.update(e),new Uint8Array(n.digest())}function ug(t){const e=new DataView(t.buffer),n=e.getUint32(0,!0),r=e.getUint32(4,!0),i=e.getUint32(8,!0),s=e.getUint32(12,!0);return[new Fr([n,r],0),new Fr([i,s],0)]}class kf{constructor(e,n,r){if(this.bitmap=e,this.padding=n,this.hashCount=r,n<0||n>=8)throw new Po(`Invalid padding: ${n}`);if(r<0)throw new Po(`Invalid hash count: ${r}`);if(e.length>0&&this.hashCount===0)throw new Po(`Invalid hash count: ${r}`);if(e.length===0&&n!==0)throw new Po(`Invalid padding when bitmap length is 0: ${n}`);this.ge=8*e.length-n,this.pe=Fr.fromNumber(this.ge)}ye(e,n,r){let i=e.add(n.multiply(Fr.fromNumber(r)));return i.compare(Nb)===1&&(i=new Fr([i.getBits(0),i.getBits(1)],0)),i.modulo(this.pe).toNumber()}we(e){return!!(this.bitmap[Math.floor(e/8)]&1<<e%8)}mightContain(e){if(this.ge===0)return!1;const n=lg(e),[r,i]=ug(n);for(let s=0;s<this.hashCount;s++){const o=this.ye(r,i,s);if(!this.we(o))return!1}return!0}static create(e,n,r){const i=e%8==0?0:8-e%8,s=new Uint8Array(Math.ceil(e/8)),o=new kf(s,i,n);return r.forEach(l=>o.insert(l)),o}insert(e){if(this.ge===0)return;const n=lg(e),[r,i]=ug(n);for(let s=0;s<this.hashCount;s++){const o=this.ye(r,i,s);this.Se(o)}}Se(e){const n=Math.floor(e/8),r=e%8;this.bitmap[n]|=1<<r}}class Po extends Error{constructor(){super(...arguments),this.name="BloomFilterError"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xu{constructor(e,n,r,i,s){this.snapshotVersion=e,this.targetChanges=n,this.targetMismatches=r,this.documentUpdates=i,this.resolvedLimboDocuments=s}static createSynthesizedRemoteEventForCurrentChange(e,n,r){const i=new Map;return i.set(e,Ca.createSynthesizedTargetChangeForCurrentChange(e,n,r)),new Xu(re.min(),i,new Me(le),rr(),ue())}}class Ca{constructor(e,n,r,i,s){this.resumeToken=e,this.current=n,this.addedDocuments=r,this.modifiedDocuments=i,this.removedDocuments=s}static createSynthesizedTargetChangeForCurrentChange(e,n,r){return new Ca(r,n,ue(),ue(),ue())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class jl{constructor(e,n,r,i){this.be=e,this.removedTargetIds=n,this.key=r,this.De=i}}class l1{constructor(e,n){this.targetId=e,this.Ce=n}}class u1{constructor(e,n,r=mt.EMPTY_BYTE_STRING,i=null){this.state=e,this.targetIds=n,this.resumeToken=r,this.cause=i}}class cg{constructor(){this.ve=0,this.Fe=dg(),this.Me=mt.EMPTY_BYTE_STRING,this.xe=!1,this.Oe=!0}get current(){return this.xe}get resumeToken(){return this.Me}get Ne(){return this.ve!==0}get Be(){return this.Oe}Le(e){e.approximateByteSize()>0&&(this.Oe=!0,this.Me=e)}ke(){let e=ue(),n=ue(),r=ue();return this.Fe.forEach((i,s)=>{switch(s){case 0:e=e.add(i);break;case 2:n=n.add(i);break;case 1:r=r.add(i);break;default:ee(38017,{changeType:s})}}),new Ca(this.Me,this.xe,e,n,r)}qe(){this.Oe=!1,this.Fe=dg()}Ke(e,n){this.Oe=!0,this.Fe=this.Fe.insert(e,n)}Ue(e){this.Oe=!0,this.Fe=this.Fe.remove(e)}$e(){this.ve+=1}We(){this.ve-=1,ve(this.ve>=0,3241,{ve:this.ve})}Qe(){this.Oe=!0,this.xe=!0}}class Vb{constructor(e){this.Ge=e,this.ze=new Map,this.je=rr(),this.Je=ml(),this.He=ml(),this.Ze=new Me(le)}Xe(e){for(const n of e.be)e.De&&e.De.isFoundDocument()?this.Ye(n,e.De):this.et(n,e.key,e.De);for(const n of e.removedTargetIds)this.et(n,e.key,e.De)}tt(e){this.forEachTarget(e,n=>{const r=this.nt(n);switch(e.state){case 0:this.rt(n)&&r.Le(e.resumeToken);break;case 1:r.We(),r.Ne||r.qe(),r.Le(e.resumeToken);break;case 2:r.We(),r.Ne||this.removeTarget(n);break;case 3:this.rt(n)&&(r.Qe(),r.Le(e.resumeToken));break;case 4:this.rt(n)&&(this.it(n),r.Le(e.resumeToken));break;default:ee(56790,{state:e.state})}})}forEachTarget(e,n){e.targetIds.length>0?e.targetIds.forEach(n):this.ze.forEach((r,i)=>{this.rt(i)&&n(i)})}st(e){const n=e.targetId,r=e.Ce.count,i=this.ot(n);if(i){const s=i.target;if(nh(s))if(r===0){const o=new X(s.path);this.et(n,o,xt.newNoDocument(o,re.min()))}else ve(r===1,20013,{expectedCount:r});else{const o=this._t(n);if(o!==r){const l=this.ut(e),u=l?this.ct(l,e,o):1;if(u!==0){this.it(n);const d=u===2?"TargetPurposeExistenceFilterMismatchBloom":"TargetPurposeExistenceFilterMismatch";this.Ze=this.Ze.insert(n,d)}}}}}ut(e){const n=e.Ce.unchangedNames;if(!n||!n.bits)return null;const{bits:{bitmap:r="",padding:i=0},hashCount:s=0}=n;let o,l;try{o=Wr(r).toUint8Array()}catch(u){if(u instanceof Nv)return Vi("Decoding the base64 bloom filter in existence filter failed ("+u.message+"); ignoring the bloom filter and falling back to full re-query."),null;throw u}try{l=new kf(o,i,s)}catch(u){return Vi(u instanceof Po?"BloomFilter error: ":"Applying bloom filter failed: ",u),null}return l.ge===0?null:l}ct(e,n,r){return n.Ce.count===r-this.Pt(e,n.targetId)?0:2}Pt(e,n){const r=this.Ge.getRemoteKeysForTarget(n);let i=0;return r.forEach(s=>{const o=this.Ge.ht(),l=`projects/${o.projectId}/databases/${o.database}/documents/${s.path.canonicalString()}`;e.mightContain(l)||(this.et(n,s,null),i++)}),i}Tt(e){const n=new Map;this.ze.forEach((s,o)=>{const l=this.ot(o);if(l){if(s.current&&nh(l.target)){const u=new X(l.target.path);this.Et(u).has(o)||this.It(o,u)||this.et(o,u,xt.newNoDocument(u,e))}s.Be&&(n.set(o,s.ke()),s.qe())}});let r=ue();this.He.forEach((s,o)=>{let l=!0;o.forEachWhile(u=>{const d=this.ot(u);return!d||d.purpose==="TargetPurposeLimboResolution"||(l=!1,!1)}),l&&(r=r.add(s))}),this.je.forEach((s,o)=>o.setReadTime(e));const i=new Xu(e,n,this.Ze,this.je,r);return this.je=rr(),this.Je=ml(),this.He=ml(),this.Ze=new Me(le),i}Ye(e,n){if(!this.rt(e))return;const r=this.It(e,n.key)?2:0;this.nt(e).Ke(n.key,r),this.je=this.je.insert(n.key,n),this.Je=this.Je.insert(n.key,this.Et(n.key).add(e)),this.He=this.He.insert(n.key,this.Rt(n.key).add(e))}et(e,n,r){if(!this.rt(e))return;const i=this.nt(e);this.It(e,n)?i.Ke(n,1):i.Ue(n),this.He=this.He.insert(n,this.Rt(n).delete(e)),this.He=this.He.insert(n,this.Rt(n).add(e)),r&&(this.je=this.je.insert(n,r))}removeTarget(e){this.ze.delete(e)}_t(e){const n=this.nt(e).ke();return this.Ge.getRemoteKeysForTarget(e).size+n.addedDocuments.size-n.removedDocuments.size}$e(e){this.nt(e).$e()}nt(e){let n=this.ze.get(e);return n||(n=new cg,this.ze.set(e,n)),n}Rt(e){let n=this.He.get(e);return n||(n=new Ze(le),this.He=this.He.insert(e,n)),n}Et(e){let n=this.Je.get(e);return n||(n=new Ze(le),this.Je=this.Je.insert(e,n)),n}rt(e){const n=this.ot(e)!==null;return n||K("WatchChangeAggregator","Detected inactive target",e),n}ot(e){const n=this.ze.get(e);return n&&n.Ne?null:this.Ge.At(e)}it(e){this.ze.set(e,new cg),this.Ge.getRemoteKeysForTarget(e).forEach(n=>{this.et(e,n,null)})}It(e,n){return this.Ge.getRemoteKeysForTarget(e).has(n)}}function ml(){return new Me(X.comparator)}function dg(){return new Me(X.comparator)}const Db={asc:"ASCENDING",desc:"DESCENDING"},Mb={"<":"LESS_THAN","<=":"LESS_THAN_OR_EQUAL",">":"GREATER_THAN",">=":"GREATER_THAN_OR_EQUAL","==":"EQUAL","!=":"NOT_EQUAL","array-contains":"ARRAY_CONTAINS",in:"IN","not-in":"NOT_IN","array-contains-any":"ARRAY_CONTAINS_ANY"},Lb={and:"AND",or:"OR"};class jb{constructor(e,n){this.databaseId=e,this.useProto3Json=n}}function ih(t,e){return t.useProto3Json||Hu(e)?e:{value:e}}function _u(t,e){return t.useProto3Json?`${new Date(1e3*e.seconds).toISOString().replace(/\.\d*/,"").replace("Z","")}.${("000000000"+e.nanoseconds).slice(-9)}Z`:{seconds:""+e.seconds,nanos:e.nanoseconds}}function c1(t,e){return t.useProto3Json?e.toBase64():e.toUint8Array()}function Ob(t,e){return _u(t,e.toTimestamp())}function On(t){return ve(!!t,49232),re.fromTimestamp(function(n){const r=Hr(n);return new ke(r.seconds,r.nanos)}(t))}function If(t,e){return sh(t,e).canonicalString()}function sh(t,e){const n=function(i){return new Ee(["projects",i.projectId,"databases",i.database])}(t).child("documents");return e===void 0?n:n.child(e)}function d1(t){const e=Ee.fromString(t);return ve(g1(e),10190,{key:e.toString()}),e}function oh(t,e){return If(t.databaseId,e.path)}function Gc(t,e){const n=d1(e);if(n.get(1)!==t.databaseId.projectId)throw new G(L.INVALID_ARGUMENT,"Tried to deserialize key from different project: "+n.get(1)+" vs "+t.databaseId.projectId);if(n.get(3)!==t.databaseId.database)throw new G(L.INVALID_ARGUMENT,"Tried to deserialize key from different database: "+n.get(3)+" vs "+t.databaseId.database);return new X(f1(n))}function h1(t,e){return If(t.databaseId,e)}function Fb(t){const e=d1(t);return e.length===4?Ee.emptyPath():f1(e)}function ah(t){return new Ee(["projects",t.databaseId.projectId,"databases",t.databaseId.database]).canonicalString()}function f1(t){return ve(t.length>4&&t.get(4)==="documents",29091,{key:t.toString()}),t.popFirst(5)}function hg(t,e,n){return{name:oh(t,e),fields:n.value.mapValue.fields}}function zb(t,e){let n;if("targetChange"in e){e.targetChange;const r=function(d){return d==="NO_CHANGE"?0:d==="ADD"?1:d==="REMOVE"?2:d==="CURRENT"?3:d==="RESET"?4:ee(39313,{state:d})}(e.targetChange.targetChangeType||"NO_CHANGE"),i=e.targetChange.targetIds||[],s=function(d,p){return d.useProto3Json?(ve(p===void 0||typeof p=="string",58123),mt.fromBase64String(p||"")):(ve(p===void 0||p instanceof Buffer||p instanceof Uint8Array,16193),mt.fromUint8Array(p||new Uint8Array))}(t,e.targetChange.resumeToken),o=e.targetChange.cause,l=o&&function(d){const p=d.code===void 0?L.UNKNOWN:a1(d.code);return new G(p,d.message||"")}(o);n=new u1(r,i,s,l||null)}else if("documentChange"in e){e.documentChange;const r=e.documentChange;r.document,r.document.name,r.document.updateTime;const i=Gc(t,r.document.name),s=On(r.document.updateTime),o=r.document.createTime?On(r.document.createTime):re.min(),l=new nn({mapValue:{fields:r.document.fields}}),u=xt.newFoundDocument(i,s,o,l),d=r.targetIds||[],p=r.removedTargetIds||[];n=new jl(d,p,u.key,u)}else if("documentDelete"in e){e.documentDelete;const r=e.documentDelete;r.document;const i=Gc(t,r.document),s=r.readTime?On(r.readTime):re.min(),o=xt.newNoDocument(i,s),l=r.removedTargetIds||[];n=new jl([],l,o.key,o)}else if("documentRemove"in e){e.documentRemove;const r=e.documentRemove;r.document;const i=Gc(t,r.document),s=r.removedTargetIds||[];n=new jl([],s,i,null)}else{if(!("filter"in e))return ee(11601,{Vt:e});{e.filter;const r=e.filter;r.targetId;const{count:i=0,unchangedNames:s}=r,o=new Cb(i,s),l=r.targetId;n=new l1(l,o)}}return n}function Ub(t,e){let n;if(e instanceof Aa)n={update:hg(t,e.key,e.value)};else if(e instanceof o1)n={delete:oh(t,e.key)};else if(e instanceof Fi)n={update:hg(t,e.key,e.data),updateMask:Yb(e.fieldMask)};else{if(!(e instanceof kb))return ee(16599,{dt:e.type});n={verify:oh(t,e.key)}}return e.fieldTransforms.length>0&&(n.updateTransforms=e.fieldTransforms.map(r=>function(s,o){const l=o.transform;if(l instanceof va)return{fieldPath:o.field.canonicalString(),setToServerValue:"REQUEST_TIME"};if(l instanceof _a)return{fieldPath:o.field.canonicalString(),appendMissingElements:{values:l.elements}};if(l instanceof wa)return{fieldPath:o.field.canonicalString(),removeAllFromArray:{values:l.elements}};if(l instanceof vu)return{fieldPath:o.field.canonicalString(),increment:l.Ae};throw ee(20930,{transform:o.transform})}(0,r))),e.precondition.isNone||(n.currentDocument=function(i,s){return s.updateTime!==void 0?{updateTime:Ob(i,s.updateTime)}:s.exists!==void 0?{exists:s.exists}:ee(27497)}(t,e.precondition)),n}function Bb(t,e){return t&&t.length>0?(ve(e!==void 0,14353),t.map(n=>function(i,s){let o=i.updateTime?On(i.updateTime):On(s);return o.isEqual(re.min())&&(o=On(s)),new bb(o,i.transformResults||[])}(n,e))):[]}function $b(t,e){return{documents:[h1(t,e.path)]}}function qb(t,e){const n={structuredQuery:{}},r=e.path;let i;e.collectionGroup!==null?(i=r,n.structuredQuery.from=[{collectionId:e.collectionGroup,allDescendants:!0}]):(i=r.popLast(),n.structuredQuery.from=[{collectionId:r.lastSegment()}]),n.parent=h1(t,i);const s=function(d){if(d.length!==0)return m1(bn.create(d,"and"))}(e.filters);s&&(n.structuredQuery.where=s);const o=function(d){if(d.length!==0)return d.map(p=>function(v){return{field:ns(v.field),direction:Gb(v.dir)}}(p))}(e.orderBy);o&&(n.structuredQuery.orderBy=o);const l=ih(t,e.limit);return l!==null&&(n.structuredQuery.limit=l),e.startAt&&(n.structuredQuery.startAt=function(d){return{before:d.inclusive,values:d.position}}(e.startAt)),e.endAt&&(n.structuredQuery.endAt=function(d){return{before:!d.inclusive,values:d.position}}(e.endAt)),{ft:n,parent:i}}function Hb(t){let e=Fb(t.parent);const n=t.structuredQuery,r=n.from?n.from.length:0;let i=null;if(r>0){ve(r===1,65062);const p=n.from[0];p.allDescendants?i=p.collectionId:e=e.child(p.collectionId)}let s=[];n.where&&(s=function(m){const v=p1(m);return v instanceof bn&&Bv(v)?v.getFilters():[v]}(n.where));let o=[];n.orderBy&&(o=function(m){return m.map(v=>function(A){return new ya(rs(A.field),function(M){switch(M){case"ASCENDING":return"asc";case"DESCENDING":return"desc";default:return}}(A.direction))}(v))}(n.orderBy));let l=null;n.limit&&(l=function(m){let v;return v=typeof m=="object"?m.value:m,Hu(v)?null:v}(n.limit));let u=null;n.startAt&&(u=function(m){const v=!!m.before,I=m.values||[];return new gu(I,v)}(n.startAt));let d=null;return n.endAt&&(d=function(m){const v=!m.before,I=m.values||[];return new gu(I,v)}(n.endAt)),ab(e,i,o,s,l,"F",u,d)}function Wb(t,e){const n=function(i){switch(i){case"TargetPurposeListen":return null;case"TargetPurposeExistenceFilterMismatch":return"existence-filter-mismatch";case"TargetPurposeExistenceFilterMismatchBloom":return"existence-filter-mismatch-bloom";case"TargetPurposeLimboResolution":return"limbo-document";default:return ee(28987,{purpose:i})}}(e.purpose);return n==null?null:{"goog-listen-tags":n}}function p1(t){return t.unaryFilter!==void 0?function(n){switch(n.unaryFilter.op){case"IS_NAN":const r=rs(n.unaryFilter.field);return We.create(r,"==",{doubleValue:NaN});case"IS_NULL":const i=rs(n.unaryFilter.field);return We.create(i,"==",{nullValue:"NULL_VALUE"});case"IS_NOT_NAN":const s=rs(n.unaryFilter.field);return We.create(s,"!=",{doubleValue:NaN});case"IS_NOT_NULL":const o=rs(n.unaryFilter.field);return We.create(o,"!=",{nullValue:"NULL_VALUE"});case"OPERATOR_UNSPECIFIED":return ee(61313);default:return ee(60726)}}(t):t.fieldFilter!==void 0?function(n){return We.create(rs(n.fieldFilter.field),function(i){switch(i){case"EQUAL":return"==";case"NOT_EQUAL":return"!=";case"GREATER_THAN":return">";case"GREATER_THAN_OR_EQUAL":return">=";case"LESS_THAN":return"<";case"LESS_THAN_OR_EQUAL":return"<=";case"ARRAY_CONTAINS":return"array-contains";case"IN":return"in";case"NOT_IN":return"not-in";case"ARRAY_CONTAINS_ANY":return"array-contains-any";case"OPERATOR_UNSPECIFIED":return ee(58110);default:return ee(50506)}}(n.fieldFilter.op),n.fieldFilter.value)}(t):t.compositeFilter!==void 0?function(n){return bn.create(n.compositeFilter.filters.map(r=>p1(r)),function(i){switch(i){case"AND":return"and";case"OR":return"or";default:return ee(1026)}}(n.compositeFilter.op))}(t):ee(30097,{filter:t})}function Gb(t){return Db[t]}function Kb(t){return Mb[t]}function Qb(t){return Lb[t]}function ns(t){return{fieldPath:t.canonicalString()}}function rs(t){return ht.fromServerFormat(t.fieldPath)}function m1(t){return t instanceof We?function(n){if(n.op==="=="){if(Zm(n.value))return{unaryFilter:{field:ns(n.field),op:"IS_NAN"}};if(Jm(n.value))return{unaryFilter:{field:ns(n.field),op:"IS_NULL"}}}else if(n.op==="!="){if(Zm(n.value))return{unaryFilter:{field:ns(n.field),op:"IS_NOT_NAN"}};if(Jm(n.value))return{unaryFilter:{field:ns(n.field),op:"IS_NOT_NULL"}}}return{fieldFilter:{field:ns(n.field),op:Kb(n.op),value:n.value}}}(t):t instanceof bn?function(n){const r=n.getFilters().map(i=>m1(i));return r.length===1?r[0]:{compositeFilter:{op:Qb(n.op),filters:r}}}(t):ee(54877,{filter:t})}function Yb(t){const e=[];return t.fields.forEach(n=>e.push(n.canonicalString())),{fieldPaths:e}}function g1(t){return t.length>=4&&t.get(0)==="projects"&&t.get(2)==="databases"}function y1(t){return!!t&&typeof t._toProto=="function"&&t._protoValueType==="ProtoValue"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ar{constructor(e,n,r,i,s=re.min(),o=re.min(),l=mt.EMPTY_BYTE_STRING,u=null){this.target=e,this.targetId=n,this.purpose=r,this.sequenceNumber=i,this.snapshotVersion=s,this.lastLimboFreeSnapshotVersion=o,this.resumeToken=l,this.expectedCount=u}withSequenceNumber(e){return new Ar(this.target,this.targetId,this.purpose,e,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,this.expectedCount)}withResumeToken(e,n){return new Ar(this.target,this.targetId,this.purpose,this.sequenceNumber,n,this.lastLimboFreeSnapshotVersion,e,null)}withExpectedCount(e){return new Ar(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,this.lastLimboFreeSnapshotVersion,this.resumeToken,e)}withLastLimboFreeSnapshotVersion(e){return new Ar(this.target,this.targetId,this.purpose,this.sequenceNumber,this.snapshotVersion,e,this.resumeToken,this.expectedCount)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xb{constructor(e){this.yt=e}}function Jb(t){const e=Hb({parent:t.parent,structuredQuery:t.structuredQuery});return t.limitType==="LAST"?yu(e,e.limit,"L"):e}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zb{constructor(){this.bn=new eT}addToCollectionParentIndex(e,n){return this.bn.add(n),j.resolve()}getCollectionParents(e,n){return j.resolve(this.bn.getEntries(n))}addFieldIndex(e,n){return j.resolve()}deleteFieldIndex(e,n){return j.resolve()}deleteAllFieldIndexes(e){return j.resolve()}createTargetIndexes(e,n){return j.resolve()}getDocumentsMatchingTarget(e,n){return j.resolve(null)}getIndexType(e,n){return j.resolve(0)}getFieldIndexes(e,n){return j.resolve([])}getNextCollectionGroupToUpdate(e){return j.resolve(null)}getMinOffset(e,n){return j.resolve(qr.min())}getMinOffsetFromCollectionGroup(e,n){return j.resolve(qr.min())}updateCollectionGroup(e,n,r){return j.resolve()}updateIndexEntries(e,n){return j.resolve()}}class eT{constructor(){this.index={}}add(e){const n=e.lastSegment(),r=e.popLast(),i=this.index[n]||new Ze(Ee.comparator),s=!i.has(r);return this.index[n]=i.add(r),s}has(e){const n=e.lastSegment(),r=e.popLast(),i=this.index[n];return i&&i.has(r)}getEntries(e){return(this.index[e]||new Ze(Ee.comparator)).toArray()}}/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const fg={didRun:!1,sequenceNumbersCollected:0,targetsRemoved:0,documentsRemoved:0},v1=41943040;class Nt{static withCacheSize(e){return new Nt(e,Nt.DEFAULT_COLLECTION_PERCENTILE,Nt.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT)}constructor(e,n,r){this.cacheSizeCollectionThreshold=e,this.percentileToCollect=n,this.maximumSequenceNumbersToCollect=r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Nt.DEFAULT_COLLECTION_PERCENTILE=10,Nt.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT=1e3,Nt.DEFAULT=new Nt(v1,Nt.DEFAULT_COLLECTION_PERCENTILE,Nt.DEFAULT_MAX_SEQUENCE_NUMBERS_TO_COLLECT),Nt.DISABLED=new Nt(-1,0,0);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Os{constructor(e){this.sr=e}next(){return this.sr+=2,this.sr}static _r(){return new Os(0)}static ar(){return new Os(-1)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const pg="LruGarbageCollector",tT=1048576;function mg([t,e],[n,r]){const i=le(t,n);return i===0?le(e,r):i}class nT{constructor(e){this.Pr=e,this.buffer=new Ze(mg),this.Tr=0}Er(){return++this.Tr}Ir(e){const n=[e,this.Er()];if(this.buffer.size<this.Pr)this.buffer=this.buffer.add(n);else{const r=this.buffer.last();mg(n,r)<0&&(this.buffer=this.buffer.delete(r).add(n))}}get maxValue(){return this.buffer.last()[0]}}class rT{constructor(e,n,r){this.garbageCollector=e,this.asyncQueue=n,this.localStore=r,this.Rr=null}start(){this.garbageCollector.params.cacheSizeCollectionThreshold!==-1&&this.Ar(6e4)}stop(){this.Rr&&(this.Rr.cancel(),this.Rr=null)}get started(){return this.Rr!==null}Ar(e){K(pg,`Garbage collection scheduled in ${e}ms`),this.Rr=this.asyncQueue.enqueueAfterDelay("lru_garbage_collection",e,async()=>{this.Rr=null;try{await this.localStore.collectGarbage(this.garbageCollector)}catch(n){Ws(n)?K(pg,"Ignoring IndexedDB error during garbage collection: ",n):await Hs(n)}await this.Ar(3e5)})}}class iT{constructor(e,n){this.Vr=e,this.params=n}calculateTargetCount(e,n){return this.Vr.dr(e).next(r=>Math.floor(n/100*r))}nthSequenceNumber(e,n){if(n===0)return j.resolve(qu.ce);const r=new nT(n);return this.Vr.forEachTarget(e,i=>r.Ir(i.sequenceNumber)).next(()=>this.Vr.mr(e,i=>r.Ir(i))).next(()=>r.maxValue)}removeTargets(e,n,r){return this.Vr.removeTargets(e,n,r)}removeOrphanedDocuments(e,n){return this.Vr.removeOrphanedDocuments(e,n)}collect(e,n){return this.params.cacheSizeCollectionThreshold===-1?(K("LruGarbageCollector","Garbage collection skipped; disabled"),j.resolve(fg)):this.getCacheSize(e).next(r=>r<this.params.cacheSizeCollectionThreshold?(K("LruGarbageCollector",`Garbage collection skipped; Cache size ${r} is lower than threshold ${this.params.cacheSizeCollectionThreshold}`),fg):this.gr(e,n))}getCacheSize(e){return this.Vr.getCacheSize(e)}gr(e,n){let r,i,s,o,l,u,d;const p=Date.now();return this.calculateTargetCount(e,this.params.percentileToCollect).next(m=>(m>this.params.maximumSequenceNumbersToCollect?(K("LruGarbageCollector",`Capping sequence numbers to collect down to the maximum of ${this.params.maximumSequenceNumbersToCollect} from ${m}`),i=this.params.maximumSequenceNumbersToCollect):i=m,o=Date.now(),this.nthSequenceNumber(e,i))).next(m=>(r=m,l=Date.now(),this.removeTargets(e,r,n))).next(m=>(s=m,u=Date.now(),this.removeOrphanedDocuments(e,r))).next(m=>(d=Date.now(),es()<=fe.DEBUG&&K("LruGarbageCollector",`LRU Garbage Collection
	Counted targets in ${o-p}ms
	Determined least recently used ${i} in `+(l-o)+`ms
	Removed ${s} targets in `+(u-l)+`ms
	Removed ${m} documents in `+(d-u)+`ms
Total Duration: ${d-p}ms`),j.resolve({didRun:!0,sequenceNumbersCollected:i,targetsRemoved:s,documentsRemoved:m})))}}function sT(t,e){return new iT(t,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oT{constructor(){this.changes=new Oi(e=>e.toString(),(e,n)=>e.isEqual(n)),this.changesApplied=!1}addEntry(e){this.assertNotApplied(),this.changes.set(e.key,e)}removeEntry(e,n){this.assertNotApplied(),this.changes.set(e,xt.newInvalidDocument(e).setReadTime(n))}getEntry(e,n){this.assertNotApplied();const r=this.changes.get(n);return r!==void 0?j.resolve(r):this.getFromCache(e,n)}getEntries(e,n){return this.getAllFromCache(e,n)}apply(e){return this.assertNotApplied(),this.changesApplied=!0,this.applyChanges(e)}assertNotApplied(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class aT{constructor(e,n){this.overlayedDocument=e,this.mutatedFields=n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lT{constructor(e,n,r,i){this.remoteDocumentCache=e,this.mutationQueue=n,this.documentOverlayCache=r,this.indexManager=i}getDocument(e,n){let r=null;return this.documentOverlayCache.getOverlay(e,n).next(i=>(r=i,this.remoteDocumentCache.getEntry(e,n))).next(i=>(r!==null&&Ho(r.mutation,i,vn.empty(),ke.now()),i))}getDocuments(e,n){return this.remoteDocumentCache.getEntries(e,n).next(r=>this.getLocalViewOfDocuments(e,r,ue()).next(()=>r))}getLocalViewOfDocuments(e,n,r=ue()){const i=bi();return this.populateOverlays(e,i,n).next(()=>this.computeViews(e,n,i,r).next(s=>{let o=Ro();return s.forEach((l,u)=>{o=o.insert(l,u.overlayedDocument)}),o}))}getOverlayedDocuments(e,n){const r=bi();return this.populateOverlays(e,r,n).next(()=>this.computeViews(e,n,r,ue()))}populateOverlays(e,n,r){const i=[];return r.forEach(s=>{n.has(s)||i.push(s)}),this.documentOverlayCache.getOverlays(e,i).next(s=>{s.forEach((o,l)=>{n.set(o,l)})})}computeViews(e,n,r,i){let s=rr();const o=qo(),l=function(){return qo()}();return n.forEach((u,d)=>{const p=r.get(d.key);i.has(d.key)&&(p===void 0||p.mutation instanceof Fi)?s=s.insert(d.key,d):p!==void 0?(o.set(d.key,p.mutation.getFieldMask()),Ho(p.mutation,d,p.mutation.getFieldMask(),ke.now())):o.set(d.key,vn.empty())}),this.recalculateAndSaveOverlays(e,s).next(u=>(u.forEach((d,p)=>o.set(d,p)),n.forEach((d,p)=>l.set(d,new aT(p,o.get(d)??null))),l))}recalculateAndSaveOverlays(e,n){const r=qo();let i=new Me((o,l)=>o-l),s=ue();return this.mutationQueue.getAllMutationBatchesAffectingDocumentKeys(e,n).next(o=>{for(const l of o)l.keys().forEach(u=>{const d=n.get(u);if(d===null)return;let p=r.get(u)||vn.empty();p=l.applyToLocalView(d,p),r.set(u,p);const m=(i.get(l.batchId)||ue()).add(u);i=i.insert(l.batchId,m)})}).next(()=>{const o=[],l=i.getReverseIterator();for(;l.hasNext();){const u=l.getNext(),d=u.key,p=u.value,m=Jv();p.forEach(v=>{if(!s.has(v)){const I=i1(n.get(v),r.get(v));I!==null&&m.set(v,I),s=s.add(v)}}),o.push(this.documentOverlayCache.saveOverlays(e,d,m))}return j.waitFor(o)}).next(()=>r)}recalculateAndSaveOverlaysForDocumentKeys(e,n){return this.remoteDocumentCache.getEntries(e,n).next(r=>this.recalculateAndSaveOverlays(e,r))}getDocumentsMatchingQuery(e,n,r,i){return lb(n)?this.getDocumentsMatchingDocumentQuery(e,n.path):Gv(n)?this.getDocumentsMatchingCollectionGroupQuery(e,n,r,i):this.getDocumentsMatchingCollectionQuery(e,n,r,i)}getNextDocuments(e,n,r,i){return this.remoteDocumentCache.getAllFromCollectionGroup(e,n,r,i).next(s=>{const o=i-s.size>0?this.documentOverlayCache.getOverlaysForCollectionGroup(e,n,r.largestBatchId,i-s.size):j.resolve(bi());let l=fa,u=s;return o.next(d=>j.forEach(d,(p,m)=>(l<m.largestBatchId&&(l=m.largestBatchId),s.get(p)?j.resolve():this.remoteDocumentCache.getEntry(e,p).next(v=>{u=u.insert(p,v)}))).next(()=>this.populateOverlays(e,d,s)).next(()=>this.computeViews(e,u,d,ue())).next(p=>({batchId:l,changes:Xv(p)})))})}getDocumentsMatchingDocumentQuery(e,n){return this.getDocument(e,new X(n)).next(r=>{let i=Ro();return r.isFoundDocument()&&(i=i.insert(r.key,r)),i})}getDocumentsMatchingCollectionGroupQuery(e,n,r,i){const s=n.collectionGroup;let o=Ro();return this.indexManager.getCollectionParents(e,s).next(l=>j.forEach(l,u=>{const d=function(m,v){return new Gs(v,null,m.explicitOrderBy.slice(),m.filters.slice(),m.limit,m.limitType,m.startAt,m.endAt)}(n,u.child(s));return this.getDocumentsMatchingCollectionQuery(e,d,r,i).next(p=>{p.forEach((m,v)=>{o=o.insert(m,v)})})}).next(()=>o))}getDocumentsMatchingCollectionQuery(e,n,r,i){let s;return this.documentOverlayCache.getOverlaysForCollection(e,n.path,r.largestBatchId).next(o=>(s=o,this.remoteDocumentCache.getDocumentsMatchingQuery(e,n,r,s,i))).next(o=>{s.forEach((u,d)=>{const p=d.getKey();o.get(p)===null&&(o=o.insert(p,xt.newInvalidDocument(p)))});let l=Ro();return o.forEach((u,d)=>{const p=s.get(u);p!==void 0&&Ho(p.mutation,d,vn.empty(),ke.now()),Ku(n,d)&&(l=l.insert(u,d))}),l})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class uT{constructor(e){this.serializer=e,this.Nr=new Map,this.Br=new Map}getBundleMetadata(e,n){return j.resolve(this.Nr.get(n))}saveBundleMetadata(e,n){return this.Nr.set(n.id,function(i){return{id:i.id,version:i.version,createTime:On(i.createTime)}}(n)),j.resolve()}getNamedQuery(e,n){return j.resolve(this.Br.get(n))}saveNamedQuery(e,n){return this.Br.set(n.name,function(i){return{name:i.name,query:Jb(i.bundledQuery),readTime:On(i.readTime)}}(n)),j.resolve()}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class cT{constructor(){this.overlays=new Me(X.comparator),this.Lr=new Map}getOverlay(e,n){return j.resolve(this.overlays.get(n))}getOverlays(e,n){const r=bi();return j.forEach(n,i=>this.getOverlay(e,i).next(s=>{s!==null&&r.set(i,s)})).next(()=>r)}saveOverlays(e,n,r){return r.forEach((i,s)=>{this.St(e,n,s)}),j.resolve()}removeOverlaysForBatchId(e,n,r){const i=this.Lr.get(r);return i!==void 0&&(i.forEach(s=>this.overlays=this.overlays.remove(s)),this.Lr.delete(r)),j.resolve()}getOverlaysForCollection(e,n,r){const i=bi(),s=n.length+1,o=new X(n.child("")),l=this.overlays.getIteratorFrom(o);for(;l.hasNext();){const u=l.getNext().value,d=u.getKey();if(!n.isPrefixOf(d.path))break;d.path.length===s&&u.largestBatchId>r&&i.set(u.getKey(),u)}return j.resolve(i)}getOverlaysForCollectionGroup(e,n,r,i){let s=new Me((d,p)=>d-p);const o=this.overlays.getIterator();for(;o.hasNext();){const d=o.getNext().value;if(d.getKey().getCollectionGroup()===n&&d.largestBatchId>r){let p=s.get(d.largestBatchId);p===null&&(p=bi(),s=s.insert(d.largestBatchId,p)),p.set(d.getKey(),d)}}const l=bi(),u=s.getIterator();for(;u.hasNext()&&(u.getNext().value.forEach((d,p)=>l.set(d,p)),!(l.size()>=i)););return j.resolve(l)}St(e,n,r){const i=this.overlays.get(r.key);if(i!==null){const o=this.Lr.get(i.largestBatchId).delete(r.key);this.Lr.set(i.largestBatchId,o)}this.overlays=this.overlays.insert(r.key,new Ab(n,r));let s=this.Lr.get(n);s===void 0&&(s=ue(),this.Lr.set(n,s)),this.Lr.set(n,s.add(r.key))}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dT{constructor(){this.sessionToken=mt.EMPTY_BYTE_STRING}getSessionToken(e){return j.resolve(this.sessionToken)}setSessionToken(e,n){return this.sessionToken=n,j.resolve()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Af{constructor(){this.kr=new Ze(st.qr),this.Kr=new Ze(st.Ur)}isEmpty(){return this.kr.isEmpty()}addReference(e,n){const r=new st(e,n);this.kr=this.kr.add(r),this.Kr=this.Kr.add(r)}$r(e,n){e.forEach(r=>this.addReference(r,n))}removeReference(e,n){this.Wr(new st(e,n))}Qr(e,n){e.forEach(r=>this.removeReference(r,n))}Gr(e){const n=new X(new Ee([])),r=new st(n,e),i=new st(n,e+1),s=[];return this.Kr.forEachInRange([r,i],o=>{this.Wr(o),s.push(o.key)}),s}zr(){this.kr.forEach(e=>this.Wr(e))}Wr(e){this.kr=this.kr.delete(e),this.Kr=this.Kr.delete(e)}jr(e){const n=new X(new Ee([])),r=new st(n,e),i=new st(n,e+1);let s=ue();return this.Kr.forEachInRange([r,i],o=>{s=s.add(o.key)}),s}containsKey(e){const n=new st(e,0),r=this.kr.firstAfterOrEqual(n);return r!==null&&e.isEqual(r.key)}}class st{constructor(e,n){this.key=e,this.Jr=n}static qr(e,n){return X.comparator(e.key,n.key)||le(e.Jr,n.Jr)}static Ur(e,n){return le(e.Jr,n.Jr)||X.comparator(e.key,n.key)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hT{constructor(e,n){this.indexManager=e,this.referenceDelegate=n,this.mutationQueue=[],this.Yn=1,this.Hr=new Ze(st.qr)}checkEmpty(e){return j.resolve(this.mutationQueue.length===0)}addMutationBatch(e,n,r,i){const s=this.Yn;this.Yn++,this.mutationQueue.length>0&&this.mutationQueue[this.mutationQueue.length-1];const o=new Ib(s,n,r,i);this.mutationQueue.push(o);for(const l of i)this.Hr=this.Hr.add(new st(l.key,s)),this.indexManager.addToCollectionParentIndex(e,l.key.path.popLast());return j.resolve(o)}lookupMutationBatch(e,n){return j.resolve(this.Zr(n))}getNextMutationBatchAfterBatchId(e,n){const r=n+1,i=this.Xr(r),s=i<0?0:i;return j.resolve(this.mutationQueue.length>s?this.mutationQueue[s]:null)}getHighestUnacknowledgedBatchId(){return j.resolve(this.mutationQueue.length===0?_f:this.Yn-1)}getAllMutationBatches(e){return j.resolve(this.mutationQueue.slice())}getAllMutationBatchesAffectingDocumentKey(e,n){const r=new st(n,0),i=new st(n,Number.POSITIVE_INFINITY),s=[];return this.Hr.forEachInRange([r,i],o=>{const l=this.Zr(o.Jr);s.push(l)}),j.resolve(s)}getAllMutationBatchesAffectingDocumentKeys(e,n){let r=new Ze(le);return n.forEach(i=>{const s=new st(i,0),o=new st(i,Number.POSITIVE_INFINITY);this.Hr.forEachInRange([s,o],l=>{r=r.add(l.Jr)})}),j.resolve(this.Yr(r))}getAllMutationBatchesAffectingQuery(e,n){const r=n.path,i=r.length+1;let s=r;X.isDocumentKey(s)||(s=s.child(""));const o=new st(new X(s),0);let l=new Ze(le);return this.Hr.forEachWhile(u=>{const d=u.key.path;return!!r.isPrefixOf(d)&&(d.length===i&&(l=l.add(u.Jr)),!0)},o),j.resolve(this.Yr(l))}Yr(e){const n=[];return e.forEach(r=>{const i=this.Zr(r);i!==null&&n.push(i)}),n}removeMutationBatch(e,n){ve(this.ei(n.batchId,"removed")===0,55003),this.mutationQueue.shift();let r=this.Hr;return j.forEach(n.mutations,i=>{const s=new st(i.key,n.batchId);return r=r.delete(s),this.referenceDelegate.markPotentiallyOrphaned(e,i.key)}).next(()=>{this.Hr=r})}nr(e){}containsKey(e,n){const r=new st(n,0),i=this.Hr.firstAfterOrEqual(r);return j.resolve(n.isEqual(i&&i.key))}performConsistencyCheck(e){return this.mutationQueue.length,j.resolve()}ei(e,n){return this.Xr(e)}Xr(e){return this.mutationQueue.length===0?0:e-this.mutationQueue[0].batchId}Zr(e){const n=this.Xr(e);return n<0||n>=this.mutationQueue.length?null:this.mutationQueue[n]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fT{constructor(e){this.ti=e,this.docs=function(){return new Me(X.comparator)}(),this.size=0}setIndexManager(e){this.indexManager=e}addEntry(e,n){const r=n.key,i=this.docs.get(r),s=i?i.size:0,o=this.ti(n);return this.docs=this.docs.insert(r,{document:n.mutableCopy(),size:o}),this.size+=o-s,this.indexManager.addToCollectionParentIndex(e,r.path.popLast())}removeEntry(e){const n=this.docs.get(e);n&&(this.docs=this.docs.remove(e),this.size-=n.size)}getEntry(e,n){const r=this.docs.get(n);return j.resolve(r?r.document.mutableCopy():xt.newInvalidDocument(n))}getEntries(e,n){let r=rr();return n.forEach(i=>{const s=this.docs.get(i);r=r.insert(i,s?s.document.mutableCopy():xt.newInvalidDocument(i))}),j.resolve(r)}getDocumentsMatchingQuery(e,n,r,i){let s=rr();const o=n.path,l=new X(o.child("__id-9223372036854775808__")),u=this.docs.getIteratorFrom(l);for(;u.hasNext();){const{key:d,value:{document:p}}=u.getNext();if(!o.isPrefixOf(d.path))break;d.path.length>o.length+1||OE(jE(p),r)<=0||(i.has(p.key)||Ku(n,p))&&(s=s.insert(p.key,p.mutableCopy()))}return j.resolve(s)}getAllFromCollectionGroup(e,n,r,i){ee(9500)}ni(e,n){return j.forEach(this.docs,r=>n(r))}newChangeBuffer(e){return new pT(this)}getSize(e){return j.resolve(this.size)}}class pT extends oT{constructor(e){super(),this.Mr=e}applyChanges(e){const n=[];return this.changes.forEach((r,i)=>{i.isValidDocument()?n.push(this.Mr.addEntry(e,i)):this.Mr.removeEntry(r)}),j.waitFor(n)}getFromCache(e,n){return this.Mr.getEntry(e,n)}getAllFromCache(e,n){return this.Mr.getEntries(e,n)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mT{constructor(e){this.persistence=e,this.ri=new Oi(n=>Ef(n),bf),this.lastRemoteSnapshotVersion=re.min(),this.highestTargetId=0,this.ii=0,this.si=new Af,this.targetCount=0,this.oi=Os._r()}forEachTarget(e,n){return this.ri.forEach((r,i)=>n(i)),j.resolve()}getLastRemoteSnapshotVersion(e){return j.resolve(this.lastRemoteSnapshotVersion)}getHighestSequenceNumber(e){return j.resolve(this.ii)}allocateTargetId(e){return this.highestTargetId=this.oi.next(),j.resolve(this.highestTargetId)}setTargetsMetadata(e,n,r){return r&&(this.lastRemoteSnapshotVersion=r),n>this.ii&&(this.ii=n),j.resolve()}lr(e){this.ri.set(e.target,e);const n=e.targetId;n>this.highestTargetId&&(this.oi=new Os(n),this.highestTargetId=n),e.sequenceNumber>this.ii&&(this.ii=e.sequenceNumber)}addTargetData(e,n){return this.lr(n),this.targetCount+=1,j.resolve()}updateTargetData(e,n){return this.lr(n),j.resolve()}removeTargetData(e,n){return this.ri.delete(n.target),this.si.Gr(n.targetId),this.targetCount-=1,j.resolve()}removeTargets(e,n,r){let i=0;const s=[];return this.ri.forEach((o,l)=>{l.sequenceNumber<=n&&r.get(l.targetId)===null&&(this.ri.delete(o),s.push(this.removeMatchingKeysForTargetId(e,l.targetId)),i++)}),j.waitFor(s).next(()=>i)}getTargetCount(e){return j.resolve(this.targetCount)}getTargetData(e,n){const r=this.ri.get(n)||null;return j.resolve(r)}addMatchingKeys(e,n,r){return this.si.$r(n,r),j.resolve()}removeMatchingKeys(e,n,r){this.si.Qr(n,r);const i=this.persistence.referenceDelegate,s=[];return i&&n.forEach(o=>{s.push(i.markPotentiallyOrphaned(e,o))}),j.waitFor(s)}removeMatchingKeysForTargetId(e,n){return this.si.Gr(n),j.resolve()}getMatchingKeysForTargetId(e,n){const r=this.si.jr(n);return j.resolve(r)}containsKey(e,n){return j.resolve(this.si.containsKey(n))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _1{constructor(e,n){this._i={},this.overlays={},this.ai=new qu(0),this.ui=!1,this.ui=!0,this.ci=new dT,this.referenceDelegate=e(this),this.li=new mT(this),this.indexManager=new Zb,this.remoteDocumentCache=function(i){return new fT(i)}(r=>this.referenceDelegate.hi(r)),this.serializer=new Xb(n),this.Pi=new uT(this.serializer)}start(){return Promise.resolve()}shutdown(){return this.ui=!1,Promise.resolve()}get started(){return this.ui}setDatabaseDeletedListener(){}setNetworkEnabled(){}getIndexManager(e){return this.indexManager}getDocumentOverlayCache(e){let n=this.overlays[e.toKey()];return n||(n=new cT,this.overlays[e.toKey()]=n),n}getMutationQueue(e,n){let r=this._i[e.toKey()];return r||(r=new hT(n,this.referenceDelegate),this._i[e.toKey()]=r),r}getGlobalsCache(){return this.ci}getTargetCache(){return this.li}getRemoteDocumentCache(){return this.remoteDocumentCache}getBundleCache(){return this.Pi}runTransaction(e,n,r){K("MemoryPersistence","Starting transaction:",e);const i=new gT(this.ai.next());return this.referenceDelegate.Ti(),r(i).next(s=>this.referenceDelegate.Ei(i).next(()=>s)).toPromise().then(s=>(i.raiseOnCommittedEvent(),s))}Ii(e,n){return j.or(Object.values(this._i).map(r=>()=>r.containsKey(e,n)))}}class gT extends zE{constructor(e){super(),this.currentSequenceNumber=e}}class Cf{constructor(e){this.persistence=e,this.Ri=new Af,this.Ai=null}static Vi(e){return new Cf(e)}get di(){if(this.Ai)return this.Ai;throw ee(60996)}addReference(e,n,r){return this.Ri.addReference(r,n),this.di.delete(r.toString()),j.resolve()}removeReference(e,n,r){return this.Ri.removeReference(r,n),this.di.add(r.toString()),j.resolve()}markPotentiallyOrphaned(e,n){return this.di.add(n.toString()),j.resolve()}removeTarget(e,n){this.Ri.Gr(n.targetId).forEach(i=>this.di.add(i.toString()));const r=this.persistence.getTargetCache();return r.getMatchingKeysForTargetId(e,n.targetId).next(i=>{i.forEach(s=>this.di.add(s.toString()))}).next(()=>r.removeTargetData(e,n))}Ti(){this.Ai=new Set}Ei(e){const n=this.persistence.getRemoteDocumentCache().newChangeBuffer();return j.forEach(this.di,r=>{const i=X.fromPath(r);return this.mi(e,i).next(s=>{s||n.removeEntry(i,re.min())})}).next(()=>(this.Ai=null,n.apply(e)))}updateLimboDocument(e,n){return this.mi(e,n).next(r=>{r?this.di.delete(n.toString()):this.di.add(n.toString())})}hi(e){return 0}mi(e,n){return j.or([()=>j.resolve(this.Ri.containsKey(n)),()=>this.persistence.getTargetCache().containsKey(e,n),()=>this.persistence.Ii(e,n)])}}class wu{constructor(e,n){this.persistence=e,this.fi=new Oi(r=>$E(r.path),(r,i)=>r.isEqual(i)),this.garbageCollector=sT(this,n)}static Vi(e,n){return new wu(e,n)}Ti(){}Ei(e){return j.resolve()}forEachTarget(e,n){return this.persistence.getTargetCache().forEachTarget(e,n)}dr(e){const n=this.pr(e);return this.persistence.getTargetCache().getTargetCount(e).next(r=>n.next(i=>r+i))}pr(e){let n=0;return this.mr(e,r=>{n++}).next(()=>n)}mr(e,n){return j.forEach(this.fi,(r,i)=>this.wr(e,r,i).next(s=>s?j.resolve():n(i)))}removeTargets(e,n,r){return this.persistence.getTargetCache().removeTargets(e,n,r)}removeOrphanedDocuments(e,n){let r=0;const i=this.persistence.getRemoteDocumentCache(),s=i.newChangeBuffer();return i.ni(e,o=>this.wr(e,o,n).next(l=>{l||(r++,s.removeEntry(o,re.min()))})).next(()=>s.apply(e)).next(()=>r)}markPotentiallyOrphaned(e,n){return this.fi.set(n,e.currentSequenceNumber),j.resolve()}removeTarget(e,n){const r=n.withSequenceNumber(e.currentSequenceNumber);return this.persistence.getTargetCache().updateTargetData(e,r)}addReference(e,n,r){return this.fi.set(r,e.currentSequenceNumber),j.resolve()}removeReference(e,n,r){return this.fi.set(r,e.currentSequenceNumber),j.resolve()}updateLimboDocument(e,n){return this.fi.set(n,e.currentSequenceNumber),j.resolve()}hi(e){let n=e.key.toString().length;return e.isFoundDocument()&&(n+=Dl(e.data.value)),n}wr(e,n,r){return j.or([()=>this.persistence.Ii(e,n),()=>this.persistence.getTargetCache().containsKey(e,n),()=>{const i=this.fi.get(n);return j.resolve(i!==void 0&&i>r)}])}getCacheSize(e){return this.persistence.getRemoteDocumentCache().getSize(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Rf{constructor(e,n,r,i){this.targetId=e,this.fromCache=n,this.Ts=r,this.Es=i}static Is(e,n){let r=ue(),i=ue();for(const s of n.docChanges)switch(s.type){case 0:r=r.add(s.doc.key);break;case 1:i=i.add(s.doc.key)}return new Rf(e,n.fromCache,r,i)}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class yT{constructor(){this._documentReadCount=0}get documentReadCount(){return this._documentReadCount}incrementDocumentReadCount(e){this._documentReadCount+=e}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vT{constructor(){this.Rs=!1,this.As=!1,this.Vs=100,this.ds=function(){return n2()?8:UE(e2())>0?6:4}()}initialize(e,n){this.fs=e,this.indexManager=n,this.Rs=!0}getDocumentsMatchingQuery(e,n,r,i){const s={result:null};return this.gs(e,n).next(o=>{s.result=o}).next(()=>{if(!s.result)return this.ps(e,n,i,r).next(o=>{s.result=o})}).next(()=>{if(s.result)return;const o=new yT;return this.ys(e,n,o).next(l=>{if(s.result=l,this.As)return this.ws(e,n,o,l.size)})}).next(()=>s.result)}ws(e,n,r,i){return r.documentReadCount<this.Vs?(es()<=fe.DEBUG&&K("QueryEngine","SDK will not create cache indexes for query:",ts(n),"since it only creates cache indexes for collection contains","more than or equal to",this.Vs,"documents"),j.resolve()):(es()<=fe.DEBUG&&K("QueryEngine","Query:",ts(n),"scans",r.documentReadCount,"local documents and returns",i,"documents as results."),r.documentReadCount>this.ds*i?(es()<=fe.DEBUG&&K("QueryEngine","The SDK decides to create cache indexes for query:",ts(n),"as using cache indexes may help improve performance."),this.indexManager.createTargetIndexes(e,jn(n))):j.resolve())}gs(e,n){if(rg(n))return j.resolve(null);let r=jn(n);return this.indexManager.getIndexType(e,r).next(i=>i===0?null:(n.limit!==null&&i===1&&(n=yu(n,null,"F"),r=jn(n)),this.indexManager.getDocumentsMatchingTarget(e,r).next(s=>{const o=ue(...s);return this.fs.getDocuments(e,o).next(l=>this.indexManager.getMinOffset(e,r).next(u=>{const d=this.Ss(n,l);return this.bs(n,d,o,u.readTime)?this.gs(e,yu(n,null,"F")):this.Ds(e,d,n,u)}))})))}ps(e,n,r,i){return rg(n)||i.isEqual(re.min())?j.resolve(null):this.fs.getDocuments(e,r).next(s=>{const o=this.Ss(n,s);return this.bs(n,o,r,i)?j.resolve(null):(es()<=fe.DEBUG&&K("QueryEngine","Re-using previous result from %s to execute query: %s",i.toString(),ts(n)),this.Ds(e,o,n,LE(i,fa)).next(l=>l))})}Ss(e,n){let r=new Ze(Qv(e));return n.forEach((i,s)=>{Ku(e,s)&&(r=r.add(s))}),r}bs(e,n,r,i){if(e.limit===null)return!1;if(r.size!==n.size)return!0;const s=e.limitType==="F"?n.last():n.first();return!!s&&(s.hasPendingWrites||s.version.compareTo(i)>0)}ys(e,n,r){return es()<=fe.DEBUG&&K("QueryEngine","Using full collection scan to execute query:",ts(n)),this.fs.getDocumentsMatchingQuery(e,n,qr.min(),r)}Ds(e,n,r,i){return this.fs.getDocumentsMatchingQuery(e,r,i).next(s=>(n.forEach(o=>{s=s.insert(o.key,o)}),s))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pf="LocalStore",_T=3e8;class wT{constructor(e,n,r,i){this.persistence=e,this.Cs=n,this.serializer=i,this.vs=new Me(le),this.Fs=new Oi(s=>Ef(s),bf),this.Ms=new Map,this.xs=e.getRemoteDocumentCache(),this.li=e.getTargetCache(),this.Pi=e.getBundleCache(),this.Os(r)}Os(e){this.documentOverlayCache=this.persistence.getDocumentOverlayCache(e),this.indexManager=this.persistence.getIndexManager(e),this.mutationQueue=this.persistence.getMutationQueue(e,this.indexManager),this.localDocuments=new lT(this.xs,this.mutationQueue,this.documentOverlayCache,this.indexManager),this.xs.setIndexManager(this.indexManager),this.Cs.initialize(this.localDocuments,this.indexManager)}collectGarbage(e){return this.persistence.runTransaction("Collect garbage","readwrite-primary",n=>e.collect(n,this.vs))}}function xT(t,e,n,r){return new wT(t,e,n,r)}async function w1(t,e){const n=ie(t);return await n.persistence.runTransaction("Handle user change","readonly",r=>{let i;return n.mutationQueue.getAllMutationBatches(r).next(s=>(i=s,n.Os(e),n.mutationQueue.getAllMutationBatches(r))).next(s=>{const o=[],l=[];let u=ue();for(const d of i){o.push(d.batchId);for(const p of d.mutations)u=u.add(p.key)}for(const d of s){l.push(d.batchId);for(const p of d.mutations)u=u.add(p.key)}return n.localDocuments.getDocuments(r,u).next(d=>({Ns:d,removedBatchIds:o,addedBatchIds:l}))})})}function ET(t,e){const n=ie(t);return n.persistence.runTransaction("Acknowledge batch","readwrite-primary",r=>{const i=e.batch.keys(),s=n.xs.newChangeBuffer({trackRemovals:!0});return function(l,u,d,p){const m=d.batch,v=m.keys();let I=j.resolve();return v.forEach(A=>{I=I.next(()=>p.getEntry(u,A)).next(P=>{const M=d.docVersions.get(A);ve(M!==null,48541),P.version.compareTo(M)<0&&(m.applyToRemoteDocument(P,d),P.isValidDocument()&&(P.setReadTime(d.commitVersion),p.addEntry(P)))})}),I.next(()=>l.mutationQueue.removeMutationBatch(u,m))}(n,r,e,s).next(()=>s.apply(r)).next(()=>n.mutationQueue.performConsistencyCheck(r)).next(()=>n.documentOverlayCache.removeOverlaysForBatchId(r,i,e.batch.batchId)).next(()=>n.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(r,function(l){let u=ue();for(let d=0;d<l.mutationResults.length;++d)l.mutationResults[d].transformResults.length>0&&(u=u.add(l.batch.mutations[d].key));return u}(e))).next(()=>n.localDocuments.getDocuments(r,i))})}function x1(t){const e=ie(t);return e.persistence.runTransaction("Get last remote snapshot version","readonly",n=>e.li.getLastRemoteSnapshotVersion(n))}function bT(t,e){const n=ie(t),r=e.snapshotVersion;let i=n.vs;return n.persistence.runTransaction("Apply remote event","readwrite-primary",s=>{const o=n.xs.newChangeBuffer({trackRemovals:!0});i=n.vs;const l=[];e.targetChanges.forEach((p,m)=>{const v=i.get(m);if(!v)return;l.push(n.li.removeMatchingKeys(s,p.removedDocuments,m).next(()=>n.li.addMatchingKeys(s,p.addedDocuments,m)));let I=v.withSequenceNumber(s.currentSequenceNumber);e.targetMismatches.get(m)!==null?I=I.withResumeToken(mt.EMPTY_BYTE_STRING,re.min()).withLastLimboFreeSnapshotVersion(re.min()):p.resumeToken.approximateByteSize()>0&&(I=I.withResumeToken(p.resumeToken,r)),i=i.insert(m,I),function(P,M,S){return P.resumeToken.approximateByteSize()===0||M.snapshotVersion.toMicroseconds()-P.snapshotVersion.toMicroseconds()>=_T?!0:S.addedDocuments.size+S.modifiedDocuments.size+S.removedDocuments.size>0}(v,I,p)&&l.push(n.li.updateTargetData(s,I))});let u=rr(),d=ue();if(e.documentUpdates.forEach(p=>{e.resolvedLimboDocuments.has(p)&&l.push(n.persistence.referenceDelegate.updateLimboDocument(s,p))}),l.push(TT(s,o,e.documentUpdates).next(p=>{u=p.Bs,d=p.Ls})),!r.isEqual(re.min())){const p=n.li.getLastRemoteSnapshotVersion(s).next(m=>n.li.setTargetsMetadata(s,s.currentSequenceNumber,r));l.push(p)}return j.waitFor(l).next(()=>o.apply(s)).next(()=>n.localDocuments.getLocalViewOfDocuments(s,u,d)).next(()=>u)}).then(s=>(n.vs=i,s))}function TT(t,e,n){let r=ue(),i=ue();return n.forEach(s=>r=r.add(s)),e.getEntries(t,r).next(s=>{let o=rr();return n.forEach((l,u)=>{const d=s.get(l);u.isFoundDocument()!==d.isFoundDocument()&&(i=i.add(l)),u.isNoDocument()&&u.version.isEqual(re.min())?(e.removeEntry(l,u.readTime),o=o.insert(l,u)):!d.isValidDocument()||u.version.compareTo(d.version)>0||u.version.compareTo(d.version)===0&&d.hasPendingWrites?(e.addEntry(u),o=o.insert(l,u)):K(Pf,"Ignoring outdated watch update for ",l,". Current version:",d.version," Watch version:",u.version)}),{Bs:o,Ls:i}})}function ST(t,e){const n=ie(t);return n.persistence.runTransaction("Get next mutation batch","readonly",r=>(e===void 0&&(e=_f),n.mutationQueue.getNextMutationBatchAfterBatchId(r,e)))}function kT(t,e){const n=ie(t);return n.persistence.runTransaction("Allocate target","readwrite",r=>{let i;return n.li.getTargetData(r,e).next(s=>s?(i=s,j.resolve(i)):n.li.allocateTargetId(r).next(o=>(i=new Ar(e,o,"TargetPurposeListen",r.currentSequenceNumber),n.li.addTargetData(r,i).next(()=>i))))}).then(r=>{const i=n.vs.get(r.targetId);return(i===null||r.snapshotVersion.compareTo(i.snapshotVersion)>0)&&(n.vs=n.vs.insert(r.targetId,r),n.Fs.set(e,r.targetId)),r})}async function lh(t,e,n){const r=ie(t),i=r.vs.get(e),s=n?"readwrite":"readwrite-primary";try{n||await r.persistence.runTransaction("Release target",s,o=>r.persistence.referenceDelegate.removeTarget(o,i))}catch(o){if(!Ws(o))throw o;K(Pf,`Failed to update sequence numbers for target ${e}: ${o}`)}r.vs=r.vs.remove(e),r.Fs.delete(i.target)}function gg(t,e,n){const r=ie(t);let i=re.min(),s=ue();return r.persistence.runTransaction("Execute query","readwrite",o=>function(u,d,p){const m=ie(u),v=m.Fs.get(p);return v!==void 0?j.resolve(m.vs.get(v)):m.li.getTargetData(d,p)}(r,o,jn(e)).next(l=>{if(l)return i=l.lastLimboFreeSnapshotVersion,r.li.getMatchingKeysForTargetId(o,l.targetId).next(u=>{s=u})}).next(()=>r.Cs.getDocumentsMatchingQuery(o,e,n?i:re.min(),n?s:ue())).next(l=>(IT(r,db(e),l),{documents:l,ks:s})))}function IT(t,e,n){let r=t.Ms.get(e)||re.min();n.forEach((i,s)=>{s.readTime.compareTo(r)>0&&(r=s.readTime)}),t.Ms.set(e,r)}class yg{constructor(){this.activeTargetIds=yb()}Qs(e){this.activeTargetIds=this.activeTargetIds.add(e)}Gs(e){this.activeTargetIds=this.activeTargetIds.delete(e)}Ws(){const e={activeTargetIds:this.activeTargetIds.toArray(),updateTimeMs:Date.now()};return JSON.stringify(e)}}class AT{constructor(){this.vo=new yg,this.Fo={},this.onlineStateHandler=null,this.sequenceNumberHandler=null}addPendingMutation(e){}updateMutationState(e,n,r){}addLocalQueryTarget(e,n=!0){return n&&this.vo.Qs(e),this.Fo[e]||"not-current"}updateQueryState(e,n,r){this.Fo[e]=n}removeLocalQueryTarget(e){this.vo.Gs(e)}isLocalQueryTarget(e){return this.vo.activeTargetIds.has(e)}clearQueryState(e){delete this.Fo[e]}getAllActiveQueryTargets(){return this.vo.activeTargetIds}isActiveQueryTarget(e){return this.vo.activeTargetIds.has(e)}start(){return this.vo=new yg,Promise.resolve()}handleUserChange(e,n,r){}setOnlineState(e){}shutdown(){}writeSequenceNumber(e){}notifyBundleLoaded(e){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class CT{Mo(e){}shutdown(){}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vg="ConnectivityMonitor";class _g{constructor(){this.xo=()=>this.Oo(),this.No=()=>this.Bo(),this.Lo=[],this.ko()}Mo(e){this.Lo.push(e)}shutdown(){window.removeEventListener("online",this.xo),window.removeEventListener("offline",this.No)}ko(){window.addEventListener("online",this.xo),window.addEventListener("offline",this.No)}Oo(){K(vg,"Network connectivity changed: AVAILABLE");for(const e of this.Lo)e(0)}Bo(){K(vg,"Network connectivity changed: UNAVAILABLE");for(const e of this.Lo)e(1)}static v(){return typeof window<"u"&&window.addEventListener!==void 0&&window.removeEventListener!==void 0}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let gl=null;function uh(){return gl===null?gl=function(){return 268435456+Math.round(2147483648*Math.random())}():gl++,"0x"+gl.toString(16)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Kc="RestConnection",RT={BatchGetDocuments:"batchGet",Commit:"commit",RunQuery:"runQuery",RunAggregationQuery:"runAggregationQuery",ExecutePipeline:"executePipeline"};class PT{get qo(){return!1}constructor(e){this.databaseInfo=e,this.databaseId=e.databaseId;const n=e.ssl?"https":"http",r=encodeURIComponent(this.databaseId.projectId),i=encodeURIComponent(this.databaseId.database);this.Ko=n+"://"+e.host,this.Uo=`projects/${r}/databases/${i}`,this.$o=this.databaseId.database===pu?`project_id=${r}`:`project_id=${r}&database_id=${i}`}Wo(e,n,r,i,s){const o=uh(),l=this.Qo(e,n.toUriEncodedString());K(Kc,`Sending RPC '${e}' ${o}:`,l,r);const u={"google-cloud-resource-prefix":this.Uo,"x-goog-request-params":this.$o};this.Go(u,i,s);const{host:d}=new URL(l),p=fv(d);return this.zo(e,l,u,r,p).then(m=>(K(Kc,`Received RPC '${e}' ${o}: `,m),m),m=>{throw Vi(Kc,`RPC '${e}' ${o} failed with error: `,m,"url: ",l,"request:",r),m})}jo(e,n,r,i,s,o){return this.Wo(e,n,r,i,s)}Go(e,n,r){e["X-Goog-Api-Client"]=function(){return"gl-js/ fire/"+qs}(),e["Content-Type"]="text/plain",this.databaseInfo.appId&&(e["X-Firebase-GMPID"]=this.databaseInfo.appId),n&&n.headers.forEach((i,s)=>e[s]=i),r&&r.headers.forEach((i,s)=>e[s]=i)}Qo(e,n){const r=RT[e];let i=`${this.Ko}/v1/${n}:${r}`;return this.databaseInfo.apiKey&&(i=`${i}?key=${encodeURIComponent(this.databaseInfo.apiKey)}`),i}terminate(){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class NT{constructor(e){this.Jo=e.Jo,this.Ho=e.Ho}Zo(e){this.Xo=e}Yo(e){this.e_=e}t_(e){this.n_=e}onMessage(e){this.r_=e}close(){this.Ho()}send(e){this.Jo(e)}i_(){this.Xo()}s_(){this.e_()}o_(e){this.n_(e)}__(e){this.r_(e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const vt="WebChannelConnection",Eo=(t,e,n)=>{t.listen(e,r=>{try{n(r)}catch(i){setTimeout(()=>{throw i},0)}})};class bs extends PT{constructor(e){super(e),this.a_=[],this.forceLongPolling=e.forceLongPolling,this.autoDetectLongPolling=e.autoDetectLongPolling,this.useFetchStreams=e.useFetchStreams,this.longPollingOptions=e.longPollingOptions}static u_(){if(!bs.c_){const e=Tv();Eo(e,bv.STAT_EVENT,n=>{n.stat===Xd.PROXY?K(vt,"STAT_EVENT: detected buffering proxy"):n.stat===Xd.NOPROXY&&K(vt,"STAT_EVENT: detected no buffering proxy")}),bs.c_=!0}}zo(e,n,r,i,s){const o=uh();return new Promise((l,u)=>{const d=new xv;d.setWithCredentials(!0),d.listenOnce(Ev.COMPLETE,()=>{try{switch(d.getLastErrorCode()){case Vl.NO_ERROR:const m=d.getResponseJson();K(vt,`XHR for RPC '${e}' ${o} received:`,JSON.stringify(m)),l(m);break;case Vl.TIMEOUT:K(vt,`RPC '${e}' ${o} timed out`),u(new G(L.DEADLINE_EXCEEDED,"Request time out"));break;case Vl.HTTP_ERROR:const v=d.getStatus();if(K(vt,`RPC '${e}' ${o} failed with status:`,v,"response text:",d.getResponseText()),v>0){let I=d.getResponseJson();Array.isArray(I)&&(I=I[0]);const A=I==null?void 0:I.error;if(A&&A.status&&A.message){const P=function(S){const x=S.toLowerCase().replace(/_/g,"-");return Object.values(L).indexOf(x)>=0?x:L.UNKNOWN}(A.status);u(new G(P,A.message))}else u(new G(L.UNKNOWN,"Server responded with status "+d.getStatus()))}else u(new G(L.UNAVAILABLE,"Connection failed."));break;default:ee(9055,{l_:e,streamId:o,h_:d.getLastErrorCode(),P_:d.getLastError()})}}finally{K(vt,`RPC '${e}' ${o} completed.`)}});const p=JSON.stringify(i);K(vt,`RPC '${e}' ${o} sending request:`,i),d.send(n,"POST",p,r,15)})}T_(e,n,r){const i=uh(),s=[this.Ko,"/","google.firestore.v1.Firestore","/",e,"/channel"],o=this.createWebChannelTransport(),l={httpSessionIdParam:"gsessionid",initMessageHeaders:{},messageUrlParams:{database:`projects/${this.databaseId.projectId}/databases/${this.databaseId.database}`},sendRawJson:!0,supportsCrossDomainXhr:!0,internalChannelParams:{forwardChannelRequestTimeoutMs:6e5},forceLongPolling:this.forceLongPolling,detectBufferingProxy:this.autoDetectLongPolling},u=this.longPollingOptions.timeoutSeconds;u!==void 0&&(l.longPollingTimeout=Math.round(1e3*u)),this.useFetchStreams&&(l.useFetchStreams=!0),this.Go(l.initMessageHeaders,n,r),l.encodeInitMessageHeaders=!0;const d=s.join("");K(vt,`Creating RPC '${e}' stream ${i}: ${d}`,l);const p=o.createWebChannel(d,l);this.E_(p);let m=!1,v=!1;const I=new NT({Jo:A=>{v?K(vt,`Not sending because RPC '${e}' stream ${i} is closed:`,A):(m||(K(vt,`Opening RPC '${e}' stream ${i} transport.`),p.open(),m=!0),K(vt,`RPC '${e}' stream ${i} sending:`,A),p.send(A))},Ho:()=>p.close()});return Eo(p,Co.EventType.OPEN,()=>{v||(K(vt,`RPC '${e}' stream ${i} transport opened.`),I.i_())}),Eo(p,Co.EventType.CLOSE,()=>{v||(v=!0,K(vt,`RPC '${e}' stream ${i} transport closed`),I.o_(),this.I_(p))}),Eo(p,Co.EventType.ERROR,A=>{v||(v=!0,Vi(vt,`RPC '${e}' stream ${i} transport errored. Name:`,A.name,"Message:",A.message),I.o_(new G(L.UNAVAILABLE,"The operation could not be completed")))}),Eo(p,Co.EventType.MESSAGE,A=>{var P;if(!v){const M=A.data[0];ve(!!M,16349);const S=M,x=(S==null?void 0:S.error)||((P=S[0])==null?void 0:P.error);if(x){K(vt,`RPC '${e}' stream ${i} received error:`,x);const k=x.status;let V=function(w){const y=qe[w];if(y!==void 0)return a1(y)}(k),F=x.message;k==="NOT_FOUND"&&F.includes("database")&&F.includes("does not exist")&&F.includes(this.databaseId.database)&&Vi(`Database '${this.databaseId.database}' not found. Please check your project configuration.`),V===void 0&&(V=L.INTERNAL,F="Unknown error status: "+k+" with message "+x.message),v=!0,I.o_(new G(V,F)),p.close()}else K(vt,`RPC '${e}' stream ${i} received:`,M),I.__(M)}}),bs.u_(),setTimeout(()=>{I.s_()},0),I}terminate(){this.a_.forEach(e=>e.close()),this.a_=[]}E_(e){this.a_.push(e)}I_(e){this.a_=this.a_.filter(n=>n===e)}Go(e,n,r){super.Go(e,n,r),this.databaseInfo.apiKey&&(e["x-goog-api-key"]=this.databaseInfo.apiKey)}createWebChannelTransport(){return Sv()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function VT(t){return new bs(t)}function Qc(){return typeof document<"u"?document:null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ju(t){return new jb(t,!0)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */bs.c_=!1;class E1{constructor(e,n,r=1e3,i=1.5,s=6e4){this.Ci=e,this.timerId=n,this.R_=r,this.A_=i,this.V_=s,this.d_=0,this.m_=null,this.f_=Date.now(),this.reset()}reset(){this.d_=0}g_(){this.d_=this.V_}p_(e){this.cancel();const n=Math.floor(this.d_+this.y_()),r=Math.max(0,Date.now()-this.f_),i=Math.max(0,n-r);i>0&&K("ExponentialBackoff",`Backing off for ${i} ms (base delay: ${this.d_} ms, delay with jitter: ${n} ms, last attempt: ${r} ms ago)`),this.m_=this.Ci.enqueueAfterDelay(this.timerId,i,()=>(this.f_=Date.now(),e())),this.d_*=this.A_,this.d_<this.R_&&(this.d_=this.R_),this.d_>this.V_&&(this.d_=this.V_)}w_(){this.m_!==null&&(this.m_.skipDelay(),this.m_=null)}cancel(){this.m_!==null&&(this.m_.cancel(),this.m_=null)}y_(){return(Math.random()-.5)*this.d_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wg="PersistentStream";class b1{constructor(e,n,r,i,s,o,l,u){this.Ci=e,this.S_=r,this.b_=i,this.connection=s,this.authCredentialsProvider=o,this.appCheckCredentialsProvider=l,this.listener=u,this.state=0,this.D_=0,this.C_=null,this.v_=null,this.stream=null,this.F_=0,this.M_=new E1(e,n)}x_(){return this.state===1||this.state===5||this.O_()}O_(){return this.state===2||this.state===3}start(){this.F_=0,this.state!==4?this.auth():this.N_()}async stop(){this.x_()&&await this.close(0)}B_(){this.state=0,this.M_.reset()}L_(){this.O_()&&this.C_===null&&(this.C_=this.Ci.enqueueAfterDelay(this.S_,6e4,()=>this.k_()))}q_(e){this.K_(),this.stream.send(e)}async k_(){if(this.O_())return this.close(0)}K_(){this.C_&&(this.C_.cancel(),this.C_=null)}U_(){this.v_&&(this.v_.cancel(),this.v_=null)}async close(e,n){this.K_(),this.U_(),this.M_.cancel(),this.D_++,e!==4?this.M_.reset():n&&n.code===L.RESOURCE_EXHAUSTED?(nr(n.toString()),nr("Using maximum backoff delay to prevent overloading the backend."),this.M_.g_()):n&&n.code===L.UNAUTHENTICATED&&this.state!==3&&(this.authCredentialsProvider.invalidateToken(),this.appCheckCredentialsProvider.invalidateToken()),this.stream!==null&&(this.W_(),this.stream.close(),this.stream=null),this.state=e,await this.listener.t_(n)}W_(){}auth(){this.state=1;const e=this.Q_(this.D_),n=this.D_;Promise.all([this.authCredentialsProvider.getToken(),this.appCheckCredentialsProvider.getToken()]).then(([r,i])=>{this.D_===n&&this.G_(r,i)},r=>{e(()=>{const i=new G(L.UNKNOWN,"Fetching auth token failed: "+r.message);return this.z_(i)})})}G_(e,n){const r=this.Q_(this.D_);this.stream=this.j_(e,n),this.stream.Zo(()=>{r(()=>this.listener.Zo())}),this.stream.Yo(()=>{r(()=>(this.state=2,this.v_=this.Ci.enqueueAfterDelay(this.b_,1e4,()=>(this.O_()&&(this.state=3),Promise.resolve())),this.listener.Yo()))}),this.stream.t_(i=>{r(()=>this.z_(i))}),this.stream.onMessage(i=>{r(()=>++this.F_==1?this.J_(i):this.onNext(i))})}N_(){this.state=5,this.M_.p_(async()=>{this.state=0,this.start()})}z_(e){return K(wg,`close with error: ${e}`),this.stream=null,this.close(4,e)}Q_(e){return n=>{this.Ci.enqueueAndForget(()=>this.D_===e?n():(K(wg,"stream callback skipped by getCloseGuardedDispatcher."),Promise.resolve()))}}}class DT extends b1{constructor(e,n,r,i,s,o){super(e,"listen_stream_connection_backoff","listen_stream_idle","health_check_timeout",n,r,i,o),this.serializer=s}j_(e,n){return this.connection.T_("Listen",e,n)}J_(e){return this.onNext(e)}onNext(e){this.M_.reset();const n=zb(this.serializer,e),r=function(s){if(!("targetChange"in s))return re.min();const o=s.targetChange;return o.targetIds&&o.targetIds.length?re.min():o.readTime?On(o.readTime):re.min()}(e);return this.listener.H_(n,r)}Z_(e){const n={};n.database=ah(this.serializer),n.addTarget=function(s,o){let l;const u=o.target;if(l=nh(u)?{documents:$b(s,u)}:{query:qb(s,u).ft},l.targetId=o.targetId,o.resumeToken.approximateByteSize()>0){l.resumeToken=c1(s,o.resumeToken);const d=ih(s,o.expectedCount);d!==null&&(l.expectedCount=d)}else if(o.snapshotVersion.compareTo(re.min())>0){l.readTime=_u(s,o.snapshotVersion.toTimestamp());const d=ih(s,o.expectedCount);d!==null&&(l.expectedCount=d)}return l}(this.serializer,e);const r=Wb(this.serializer,e);r&&(n.labels=r),this.q_(n)}X_(e){const n={};n.database=ah(this.serializer),n.removeTarget=e,this.q_(n)}}class MT extends b1{constructor(e,n,r,i,s,o){super(e,"write_stream_connection_backoff","write_stream_idle","health_check_timeout",n,r,i,o),this.serializer=s}get Y_(){return this.F_>0}start(){this.lastStreamToken=void 0,super.start()}W_(){this.Y_&&this.ea([])}j_(e,n){return this.connection.T_("Write",e,n)}J_(e){return ve(!!e.streamToken,31322),this.lastStreamToken=e.streamToken,ve(!e.writeResults||e.writeResults.length===0,55816),this.listener.ta()}onNext(e){ve(!!e.streamToken,12678),this.lastStreamToken=e.streamToken,this.M_.reset();const n=Bb(e.writeResults,e.commitTime),r=On(e.commitTime);return this.listener.na(r,n)}ra(){const e={};e.database=ah(this.serializer),this.q_(e)}ea(e){const n={streamToken:this.lastStreamToken,writes:e.map(r=>Ub(this.serializer,r))};this.q_(n)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class LT{}class jT extends LT{constructor(e,n,r,i){super(),this.authCredentials=e,this.appCheckCredentials=n,this.connection=r,this.serializer=i,this.ia=!1}sa(){if(this.ia)throw new G(L.FAILED_PRECONDITION,"The client has already been terminated.")}Wo(e,n,r,i){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([s,o])=>this.connection.Wo(e,sh(n,r),i,s,o)).catch(s=>{throw s.name==="FirebaseError"?(s.code===L.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),s):new G(L.UNKNOWN,s.toString())})}jo(e,n,r,i,s){return this.sa(),Promise.all([this.authCredentials.getToken(),this.appCheckCredentials.getToken()]).then(([o,l])=>this.connection.jo(e,sh(n,r),i,o,l,s)).catch(o=>{throw o.name==="FirebaseError"?(o.code===L.UNAUTHENTICATED&&(this.authCredentials.invalidateToken(),this.appCheckCredentials.invalidateToken()),o):new G(L.UNKNOWN,o.toString())})}terminate(){this.ia=!0,this.connection.terminate()}}function OT(t,e,n,r){return new jT(t,e,n,r)}class FT{constructor(e,n){this.asyncQueue=e,this.onlineStateHandler=n,this.state="Unknown",this.oa=0,this._a=null,this.aa=!0}ua(){this.oa===0&&(this.ca("Unknown"),this._a=this.asyncQueue.enqueueAfterDelay("online_state_timeout",1e4,()=>(this._a=null,this.la("Backend didn't respond within 10 seconds."),this.ca("Offline"),Promise.resolve())))}ha(e){this.state==="Online"?this.ca("Unknown"):(this.oa++,this.oa>=1&&(this.Pa(),this.la(`Connection failed 1 times. Most recent error: ${e.toString()}`),this.ca("Offline")))}set(e){this.Pa(),this.oa=0,e==="Online"&&(this.aa=!1),this.ca(e)}ca(e){e!==this.state&&(this.state=e,this.onlineStateHandler(e))}la(e){const n=`Could not reach Cloud Firestore backend. ${e}
This typically indicates that your device does not have a healthy Internet connection at the moment. The client will operate in offline mode until it is able to successfully connect to the backend.`;this.aa?(nr(n),this.aa=!1):K("OnlineStateTracker",n)}Pa(){this._a!==null&&(this._a.cancel(),this._a=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Di="RemoteStore";class zT{constructor(e,n,r,i,s){this.localStore=e,this.datastore=n,this.asyncQueue=r,this.remoteSyncer={},this.Ta=[],this.Ea=new Map,this.Ia=new Set,this.Ra=[],this.Aa=s,this.Aa.Mo(o=>{r.enqueueAndForget(async()=>{zi(this)&&(K(Di,"Restarting streams for network reachability change."),await async function(u){const d=ie(u);d.Ia.add(4),await Ra(d),d.Va.set("Unknown"),d.Ia.delete(4),await Zu(d)}(this))})}),this.Va=new FT(r,i)}}async function Zu(t){if(zi(t))for(const e of t.Ra)await e(!0)}async function Ra(t){for(const e of t.Ra)await e(!1)}function T1(t,e){const n=ie(t);n.Ea.has(e.targetId)||(n.Ea.set(e.targetId,e),Mf(n)?Df(n):Ks(n).O_()&&Vf(n,e))}function Nf(t,e){const n=ie(t),r=Ks(n);n.Ea.delete(e),r.O_()&&S1(n,e),n.Ea.size===0&&(r.O_()?r.L_():zi(n)&&n.Va.set("Unknown"))}function Vf(t,e){if(t.da.$e(e.targetId),e.resumeToken.approximateByteSize()>0||e.snapshotVersion.compareTo(re.min())>0){const n=t.remoteSyncer.getRemoteKeysForTarget(e.targetId).size;e=e.withExpectedCount(n)}Ks(t).Z_(e)}function S1(t,e){t.da.$e(e),Ks(t).X_(e)}function Df(t){t.da=new Vb({getRemoteKeysForTarget:e=>t.remoteSyncer.getRemoteKeysForTarget(e),At:e=>t.Ea.get(e)||null,ht:()=>t.datastore.serializer.databaseId}),Ks(t).start(),t.Va.ua()}function Mf(t){return zi(t)&&!Ks(t).x_()&&t.Ea.size>0}function zi(t){return ie(t).Ia.size===0}function k1(t){t.da=void 0}async function UT(t){t.Va.set("Online")}async function BT(t){t.Ea.forEach((e,n)=>{Vf(t,e)})}async function $T(t,e){k1(t),Mf(t)?(t.Va.ha(e),Df(t)):t.Va.set("Unknown")}async function qT(t,e,n){if(t.Va.set("Online"),e instanceof u1&&e.state===2&&e.cause)try{await async function(i,s){const o=s.cause;for(const l of s.targetIds)i.Ea.has(l)&&(await i.remoteSyncer.rejectListen(l,o),i.Ea.delete(l),i.da.removeTarget(l))}(t,e)}catch(r){K(Di,"Failed to remove targets %s: %s ",e.targetIds.join(","),r),await xu(t,r)}else if(e instanceof jl?t.da.Xe(e):e instanceof l1?t.da.st(e):t.da.tt(e),!n.isEqual(re.min()))try{const r=await x1(t.localStore);n.compareTo(r)>=0&&await function(s,o){const l=s.da.Tt(o);return l.targetChanges.forEach((u,d)=>{if(u.resumeToken.approximateByteSize()>0){const p=s.Ea.get(d);p&&s.Ea.set(d,p.withResumeToken(u.resumeToken,o))}}),l.targetMismatches.forEach((u,d)=>{const p=s.Ea.get(u);if(!p)return;s.Ea.set(u,p.withResumeToken(mt.EMPTY_BYTE_STRING,p.snapshotVersion)),S1(s,u);const m=new Ar(p.target,u,d,p.sequenceNumber);Vf(s,m)}),s.remoteSyncer.applyRemoteEvent(l)}(t,n)}catch(r){K(Di,"Failed to raise snapshot:",r),await xu(t,r)}}async function xu(t,e,n){if(!Ws(e))throw e;t.Ia.add(1),await Ra(t),t.Va.set("Offline"),n||(n=()=>x1(t.localStore)),t.asyncQueue.enqueueRetryable(async()=>{K(Di,"Retrying IndexedDB access"),await n(),t.Ia.delete(1),await Zu(t)})}function I1(t,e){return e().catch(n=>xu(t,n,e))}async function ec(t){const e=ie(t),n=Kr(e);let r=e.Ta.length>0?e.Ta[e.Ta.length-1].batchId:_f;for(;HT(e);)try{const i=await ST(e.localStore,r);if(i===null){e.Ta.length===0&&n.L_();break}r=i.batchId,WT(e,i)}catch(i){await xu(e,i)}A1(e)&&C1(e)}function HT(t){return zi(t)&&t.Ta.length<10}function WT(t,e){t.Ta.push(e);const n=Kr(t);n.O_()&&n.Y_&&n.ea(e.mutations)}function A1(t){return zi(t)&&!Kr(t).x_()&&t.Ta.length>0}function C1(t){Kr(t).start()}async function GT(t){Kr(t).ra()}async function KT(t){const e=Kr(t);for(const n of t.Ta)e.ea(n.mutations)}async function QT(t,e,n){const r=t.Ta.shift(),i=Sf.from(r,e,n);await I1(t,()=>t.remoteSyncer.applySuccessfulWrite(i)),await ec(t)}async function YT(t,e){e&&Kr(t).Y_&&await async function(r,i){if(function(o){return Rb(o)&&o!==L.ABORTED}(i.code)){const s=r.Ta.shift();Kr(r).B_(),await I1(r,()=>r.remoteSyncer.rejectFailedWrite(s.batchId,i)),await ec(r)}}(t,e),A1(t)&&C1(t)}async function xg(t,e){const n=ie(t);n.asyncQueue.verifyOperationInProgress(),K(Di,"RemoteStore received new credentials");const r=zi(n);n.Ia.add(3),await Ra(n),r&&n.Va.set("Unknown"),await n.remoteSyncer.handleCredentialChange(e),n.Ia.delete(3),await Zu(n)}async function XT(t,e){const n=ie(t);e?(n.Ia.delete(2),await Zu(n)):e||(n.Ia.add(2),await Ra(n),n.Va.set("Unknown"))}function Ks(t){return t.ma||(t.ma=function(n,r,i){const s=ie(n);return s.sa(),new DT(r,s.connection,s.authCredentials,s.appCheckCredentials,s.serializer,i)}(t.datastore,t.asyncQueue,{Zo:UT.bind(null,t),Yo:BT.bind(null,t),t_:$T.bind(null,t),H_:qT.bind(null,t)}),t.Ra.push(async e=>{e?(t.ma.B_(),Mf(t)?Df(t):t.Va.set("Unknown")):(await t.ma.stop(),k1(t))})),t.ma}function Kr(t){return t.fa||(t.fa=function(n,r,i){const s=ie(n);return s.sa(),new MT(r,s.connection,s.authCredentials,s.appCheckCredentials,s.serializer,i)}(t.datastore,t.asyncQueue,{Zo:()=>Promise.resolve(),Yo:GT.bind(null,t),t_:YT.bind(null,t),ta:KT.bind(null,t),na:QT.bind(null,t)}),t.Ra.push(async e=>{e?(t.fa.B_(),await ec(t)):(await t.fa.stop(),t.Ta.length>0&&(K(Di,`Stopping write stream with ${t.Ta.length} pending writes`),t.Ta=[]))})),t.fa}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Lf{constructor(e,n,r,i,s){this.asyncQueue=e,this.timerId=n,this.targetTimeMs=r,this.op=i,this.removalCallback=s,this.deferred=new zr,this.then=this.deferred.promise.then.bind(this.deferred.promise),this.deferred.promise.catch(o=>{})}get promise(){return this.deferred.promise}static createAndSchedule(e,n,r,i,s){const o=Date.now()+r,l=new Lf(e,n,o,i,s);return l.start(r),l}start(e){this.timerHandle=setTimeout(()=>this.handleDelayElapsed(),e)}skipDelay(){return this.handleDelayElapsed()}cancel(e){this.timerHandle!==null&&(this.clearTimeout(),this.deferred.reject(new G(L.CANCELLED,"Operation cancelled"+(e?": "+e:""))))}handleDelayElapsed(){this.asyncQueue.enqueueAndForget(()=>this.timerHandle!==null?(this.clearTimeout(),this.op().then(e=>this.deferred.resolve(e))):Promise.resolve())}clearTimeout(){this.timerHandle!==null&&(this.removalCallback(this),clearTimeout(this.timerHandle),this.timerHandle=null)}}function jf(t,e){if(nr("AsyncQueue",`${e}: ${t}`),Ws(t))return new G(L.UNAVAILABLE,`${e}: ${t}`);throw t}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ts{static emptySet(e){return new Ts(e.comparator)}constructor(e){this.comparator=e?(n,r)=>e(n,r)||X.comparator(n.key,r.key):(n,r)=>X.comparator(n.key,r.key),this.keyedMap=Ro(),this.sortedSet=new Me(this.comparator)}has(e){return this.keyedMap.get(e)!=null}get(e){return this.keyedMap.get(e)}first(){return this.sortedSet.minKey()}last(){return this.sortedSet.maxKey()}isEmpty(){return this.sortedSet.isEmpty()}indexOf(e){const n=this.keyedMap.get(e);return n?this.sortedSet.indexOf(n):-1}get size(){return this.sortedSet.size}forEach(e){this.sortedSet.inorderTraversal((n,r)=>(e(n),!1))}add(e){const n=this.delete(e.key);return n.copy(n.keyedMap.insert(e.key,e),n.sortedSet.insert(e,null))}delete(e){const n=this.get(e);return n?this.copy(this.keyedMap.remove(e),this.sortedSet.remove(n)):this}isEqual(e){if(!(e instanceof Ts)||this.size!==e.size)return!1;const n=this.sortedSet.getIterator(),r=e.sortedSet.getIterator();for(;n.hasNext();){const i=n.getNext().key,s=r.getNext().key;if(!i.isEqual(s))return!1}return!0}toString(){const e=[];return this.forEach(n=>{e.push(n.toString())}),e.length===0?"DocumentSet ()":`DocumentSet (
  `+e.join(`  
`)+`
)`}copy(e,n){const r=new Ts;return r.comparator=this.comparator,r.keyedMap=e,r.sortedSet=n,r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Eg{constructor(){this.ga=new Me(X.comparator)}track(e){const n=e.doc.key,r=this.ga.get(n);r?e.type!==0&&r.type===3?this.ga=this.ga.insert(n,e):e.type===3&&r.type!==1?this.ga=this.ga.insert(n,{type:r.type,doc:e.doc}):e.type===2&&r.type===2?this.ga=this.ga.insert(n,{type:2,doc:e.doc}):e.type===2&&r.type===0?this.ga=this.ga.insert(n,{type:0,doc:e.doc}):e.type===1&&r.type===0?this.ga=this.ga.remove(n):e.type===1&&r.type===2?this.ga=this.ga.insert(n,{type:1,doc:r.doc}):e.type===0&&r.type===1?this.ga=this.ga.insert(n,{type:2,doc:e.doc}):ee(63341,{Vt:e,pa:r}):this.ga=this.ga.insert(n,e)}ya(){const e=[];return this.ga.inorderTraversal((n,r)=>{e.push(r)}),e}}class Fs{constructor(e,n,r,i,s,o,l,u,d){this.query=e,this.docs=n,this.oldDocs=r,this.docChanges=i,this.mutatedKeys=s,this.fromCache=o,this.syncStateChanged=l,this.excludesMetadataChanges=u,this.hasCachedResults=d}static fromInitialDocuments(e,n,r,i,s){const o=[];return n.forEach(l=>{o.push({type:0,doc:l})}),new Fs(e,n,Ts.emptySet(n),o,r,i,!0,!1,s)}get hasPendingWrites(){return!this.mutatedKeys.isEmpty()}isEqual(e){if(!(this.fromCache===e.fromCache&&this.hasCachedResults===e.hasCachedResults&&this.syncStateChanged===e.syncStateChanged&&this.mutatedKeys.isEqual(e.mutatedKeys)&&Gu(this.query,e.query)&&this.docs.isEqual(e.docs)&&this.oldDocs.isEqual(e.oldDocs)))return!1;const n=this.docChanges,r=e.docChanges;if(n.length!==r.length)return!1;for(let i=0;i<n.length;i++)if(n[i].type!==r[i].type||!n[i].doc.isEqual(r[i].doc))return!1;return!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class JT{constructor(){this.wa=void 0,this.Sa=[]}ba(){return this.Sa.some(e=>e.Da())}}class ZT{constructor(){this.queries=bg(),this.onlineState="Unknown",this.Ca=new Set}terminate(){(function(n,r){const i=ie(n),s=i.queries;i.queries=bg(),s.forEach((o,l)=>{for(const u of l.Sa)u.onError(r)})})(this,new G(L.ABORTED,"Firestore shutting down"))}}function bg(){return new Oi(t=>Kv(t),Gu)}async function eS(t,e){const n=ie(t);let r=3;const i=e.query;let s=n.queries.get(i);s?!s.ba()&&e.Da()&&(r=2):(s=new JT,r=e.Da()?0:1);try{switch(r){case 0:s.wa=await n.onListen(i,!0);break;case 1:s.wa=await n.onListen(i,!1);break;case 2:await n.onFirstRemoteStoreListen(i)}}catch(o){const l=jf(o,`Initialization of query '${ts(e.query)}' failed`);return void e.onError(l)}n.queries.set(i,s),s.Sa.push(e),e.va(n.onlineState),s.wa&&e.Fa(s.wa)&&Of(n)}async function tS(t,e){const n=ie(t),r=e.query;let i=3;const s=n.queries.get(r);if(s){const o=s.Sa.indexOf(e);o>=0&&(s.Sa.splice(o,1),s.Sa.length===0?i=e.Da()?0:1:!s.ba()&&e.Da()&&(i=2))}switch(i){case 0:return n.queries.delete(r),n.onUnlisten(r,!0);case 1:return n.queries.delete(r),n.onUnlisten(r,!1);case 2:return n.onLastRemoteStoreUnlisten(r);default:return}}function nS(t,e){const n=ie(t);let r=!1;for(const i of e){const s=i.query,o=n.queries.get(s);if(o){for(const l of o.Sa)l.Fa(i)&&(r=!0);o.wa=i}}r&&Of(n)}function rS(t,e,n){const r=ie(t),i=r.queries.get(e);if(i)for(const s of i.Sa)s.onError(n);r.queries.delete(e)}function Of(t){t.Ca.forEach(e=>{e.next()})}var ch,Tg;(Tg=ch||(ch={})).Ma="default",Tg.Cache="cache";class iS{constructor(e,n,r){this.query=e,this.xa=n,this.Oa=!1,this.Na=null,this.onlineState="Unknown",this.options=r||{}}Fa(e){if(!this.options.includeMetadataChanges){const r=[];for(const i of e.docChanges)i.type!==3&&r.push(i);e=new Fs(e.query,e.docs,e.oldDocs,r,e.mutatedKeys,e.fromCache,e.syncStateChanged,!0,e.hasCachedResults)}let n=!1;return this.Oa?this.Ba(e)&&(this.xa.next(e),n=!0):this.La(e,this.onlineState)&&(this.ka(e),n=!0),this.Na=e,n}onError(e){this.xa.error(e)}va(e){this.onlineState=e;let n=!1;return this.Na&&!this.Oa&&this.La(this.Na,e)&&(this.ka(this.Na),n=!0),n}La(e,n){if(!e.fromCache||!this.Da())return!0;const r=n!=="Offline";return(!this.options.qa||!r)&&(!e.docs.isEmpty()||e.hasCachedResults||n==="Offline")}Ba(e){if(e.docChanges.length>0)return!0;const n=this.Na&&this.Na.hasPendingWrites!==e.hasPendingWrites;return!(!e.syncStateChanged&&!n)&&this.options.includeMetadataChanges===!0}ka(e){e=Fs.fromInitialDocuments(e.query,e.docs,e.mutatedKeys,e.fromCache,e.hasCachedResults),this.Oa=!0,this.xa.next(e)}Da(){return this.options.source!==ch.Cache}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class R1{constructor(e){this.key=e}}class P1{constructor(e){this.key=e}}class sS{constructor(e,n){this.query=e,this.Za=n,this.Xa=null,this.hasCachedResults=!1,this.current=!1,this.Ya=ue(),this.mutatedKeys=ue(),this.eu=Qv(e),this.tu=new Ts(this.eu)}get nu(){return this.Za}ru(e,n){const r=n?n.iu:new Eg,i=n?n.tu:this.tu;let s=n?n.mutatedKeys:this.mutatedKeys,o=i,l=!1;const u=this.query.limitType==="F"&&i.size===this.query.limit?i.last():null,d=this.query.limitType==="L"&&i.size===this.query.limit?i.first():null;if(e.inorderTraversal((p,m)=>{const v=i.get(p),I=Ku(this.query,m)?m:null,A=!!v&&this.mutatedKeys.has(v.key),P=!!I&&(I.hasLocalMutations||this.mutatedKeys.has(I.key)&&I.hasCommittedMutations);let M=!1;v&&I?v.data.isEqual(I.data)?A!==P&&(r.track({type:3,doc:I}),M=!0):this.su(v,I)||(r.track({type:2,doc:I}),M=!0,(u&&this.eu(I,u)>0||d&&this.eu(I,d)<0)&&(l=!0)):!v&&I?(r.track({type:0,doc:I}),M=!0):v&&!I&&(r.track({type:1,doc:v}),M=!0,(u||d)&&(l=!0)),M&&(I?(o=o.add(I),s=P?s.add(p):s.delete(p)):(o=o.delete(p),s=s.delete(p)))}),this.query.limit!==null)for(;o.size>this.query.limit;){const p=this.query.limitType==="F"?o.last():o.first();o=o.delete(p.key),s=s.delete(p.key),r.track({type:1,doc:p})}return{tu:o,iu:r,bs:l,mutatedKeys:s}}su(e,n){return e.hasLocalMutations&&n.hasCommittedMutations&&!n.hasLocalMutations}applyChanges(e,n,r,i){const s=this.tu;this.tu=e.tu,this.mutatedKeys=e.mutatedKeys;const o=e.iu.ya();o.sort((p,m)=>function(I,A){const P=M=>{switch(M){case 0:return 1;case 2:case 3:return 2;case 1:return 0;default:return ee(20277,{Vt:M})}};return P(I)-P(A)}(p.type,m.type)||this.eu(p.doc,m.doc)),this.ou(r),i=i??!1;const l=n&&!i?this._u():[],u=this.Ya.size===0&&this.current&&!i?1:0,d=u!==this.Xa;return this.Xa=u,o.length!==0||d?{snapshot:new Fs(this.query,e.tu,s,o,e.mutatedKeys,u===0,d,!1,!!r&&r.resumeToken.approximateByteSize()>0),au:l}:{au:l}}va(e){return this.current&&e==="Offline"?(this.current=!1,this.applyChanges({tu:this.tu,iu:new Eg,mutatedKeys:this.mutatedKeys,bs:!1},!1)):{au:[]}}uu(e){return!this.Za.has(e)&&!!this.tu.has(e)&&!this.tu.get(e).hasLocalMutations}ou(e){e&&(e.addedDocuments.forEach(n=>this.Za=this.Za.add(n)),e.modifiedDocuments.forEach(n=>{}),e.removedDocuments.forEach(n=>this.Za=this.Za.delete(n)),this.current=e.current)}_u(){if(!this.current)return[];const e=this.Ya;this.Ya=ue(),this.tu.forEach(r=>{this.uu(r.key)&&(this.Ya=this.Ya.add(r.key))});const n=[];return e.forEach(r=>{this.Ya.has(r)||n.push(new P1(r))}),this.Ya.forEach(r=>{e.has(r)||n.push(new R1(r))}),n}cu(e){this.Za=e.ks,this.Ya=ue();const n=this.ru(e.documents);return this.applyChanges(n,!0)}lu(){return Fs.fromInitialDocuments(this.query,this.tu,this.mutatedKeys,this.Xa===0,this.hasCachedResults)}}const Ff="SyncEngine";class oS{constructor(e,n,r){this.query=e,this.targetId=n,this.view=r}}class aS{constructor(e){this.key=e,this.hu=!1}}class lS{constructor(e,n,r,i,s,o){this.localStore=e,this.remoteStore=n,this.eventManager=r,this.sharedClientState=i,this.currentUser=s,this.maxConcurrentLimboResolutions=o,this.Pu={},this.Tu=new Oi(l=>Kv(l),Gu),this.Eu=new Map,this.Iu=new Set,this.Ru=new Me(X.comparator),this.Au=new Map,this.Vu=new Af,this.du={},this.mu=new Map,this.fu=Os.ar(),this.onlineState="Unknown",this.gu=void 0}get isPrimaryClient(){return this.gu===!0}}async function uS(t,e,n=!0){const r=j1(t);let i;const s=r.Tu.get(e);return s?(r.sharedClientState.addLocalQueryTarget(s.targetId),i=s.view.lu()):i=await N1(r,e,n,!0),i}async function cS(t,e){const n=j1(t);await N1(n,e,!0,!1)}async function N1(t,e,n,r){const i=await kT(t.localStore,jn(e)),s=i.targetId,o=t.sharedClientState.addLocalQueryTarget(s,n);let l;return r&&(l=await dS(t,e,s,o==="current",i.resumeToken)),t.isPrimaryClient&&n&&T1(t.remoteStore,i),l}async function dS(t,e,n,r,i){t.pu=(m,v,I)=>async function(P,M,S,x){let k=M.view.ru(S);k.bs&&(k=await gg(P.localStore,M.query,!1).then(({documents:w})=>M.view.ru(w,k)));const V=x&&x.targetChanges.get(M.targetId),F=x&&x.targetMismatches.get(M.targetId)!=null,B=M.view.applyChanges(k,P.isPrimaryClient,V,F);return kg(P,M.targetId,B.au),B.snapshot}(t,m,v,I);const s=await gg(t.localStore,e,!0),o=new sS(e,s.ks),l=o.ru(s.documents),u=Ca.createSynthesizedTargetChangeForCurrentChange(n,r&&t.onlineState!=="Offline",i),d=o.applyChanges(l,t.isPrimaryClient,u);kg(t,n,d.au);const p=new oS(e,n,o);return t.Tu.set(e,p),t.Eu.has(n)?t.Eu.get(n).push(e):t.Eu.set(n,[e]),d.snapshot}async function hS(t,e,n){const r=ie(t),i=r.Tu.get(e),s=r.Eu.get(i.targetId);if(s.length>1)return r.Eu.set(i.targetId,s.filter(o=>!Gu(o,e))),void r.Tu.delete(e);r.isPrimaryClient?(r.sharedClientState.removeLocalQueryTarget(i.targetId),r.sharedClientState.isActiveQueryTarget(i.targetId)||await lh(r.localStore,i.targetId,!1).then(()=>{r.sharedClientState.clearQueryState(i.targetId),n&&Nf(r.remoteStore,i.targetId),dh(r,i.targetId)}).catch(Hs)):(dh(r,i.targetId),await lh(r.localStore,i.targetId,!0))}async function fS(t,e){const n=ie(t),r=n.Tu.get(e),i=n.Eu.get(r.targetId);n.isPrimaryClient&&i.length===1&&(n.sharedClientState.removeLocalQueryTarget(r.targetId),Nf(n.remoteStore,r.targetId))}async function pS(t,e,n){const r=xS(t);try{const i=await function(o,l){const u=ie(o),d=ke.now(),p=l.reduce((I,A)=>I.add(A.key),ue());let m,v;return u.persistence.runTransaction("Locally write mutations","readwrite",I=>{let A=rr(),P=ue();return u.xs.getEntries(I,p).next(M=>{A=M,A.forEach((S,x)=>{x.isValidDocument()||(P=P.add(S))})}).next(()=>u.localDocuments.getOverlayedDocuments(I,A)).next(M=>{m=M;const S=[];for(const x of l){const k=Sb(x,m.get(x.key).overlayedDocument);k!=null&&S.push(new Fi(x.key,k,Fv(k.value.mapValue),Yn.exists(!0)))}return u.mutationQueue.addMutationBatch(I,d,S,l)}).next(M=>{v=M;const S=M.applyToLocalDocumentSet(m,P);return u.documentOverlayCache.saveOverlays(I,M.batchId,S)})}).then(()=>({batchId:v.batchId,changes:Xv(m)}))}(r.localStore,e);r.sharedClientState.addPendingMutation(i.batchId),function(o,l,u){let d=o.du[o.currentUser.toKey()];d||(d=new Me(le)),d=d.insert(l,u),o.du[o.currentUser.toKey()]=d}(r,i.batchId,n),await Pa(r,i.changes),await ec(r.remoteStore)}catch(i){const s=jf(i,"Failed to persist write");n.reject(s)}}async function V1(t,e){const n=ie(t);try{const r=await bT(n.localStore,e);e.targetChanges.forEach((i,s)=>{const o=n.Au.get(s);o&&(ve(i.addedDocuments.size+i.modifiedDocuments.size+i.removedDocuments.size<=1,22616),i.addedDocuments.size>0?o.hu=!0:i.modifiedDocuments.size>0?ve(o.hu,14607):i.removedDocuments.size>0&&(ve(o.hu,42227),o.hu=!1))}),await Pa(n,r,e)}catch(r){await Hs(r)}}function Sg(t,e,n){const r=ie(t);if(r.isPrimaryClient&&n===0||!r.isPrimaryClient&&n===1){const i=[];r.Tu.forEach((s,o)=>{const l=o.view.va(e);l.snapshot&&i.push(l.snapshot)}),function(o,l){const u=ie(o);u.onlineState=l;let d=!1;u.queries.forEach((p,m)=>{for(const v of m.Sa)v.va(l)&&(d=!0)}),d&&Of(u)}(r.eventManager,e),i.length&&r.Pu.H_(i),r.onlineState=e,r.isPrimaryClient&&r.sharedClientState.setOnlineState(e)}}async function mS(t,e,n){const r=ie(t);r.sharedClientState.updateQueryState(e,"rejected",n);const i=r.Au.get(e),s=i&&i.key;if(s){let o=new Me(X.comparator);o=o.insert(s,xt.newNoDocument(s,re.min()));const l=ue().add(s),u=new Xu(re.min(),new Map,new Me(le),o,l);await V1(r,u),r.Ru=r.Ru.remove(s),r.Au.delete(e),zf(r)}else await lh(r.localStore,e,!1).then(()=>dh(r,e,n)).catch(Hs)}async function gS(t,e){const n=ie(t),r=e.batch.batchId;try{const i=await ET(n.localStore,e);M1(n,r,null),D1(n,r),n.sharedClientState.updateMutationState(r,"acknowledged"),await Pa(n,i)}catch(i){await Hs(i)}}async function yS(t,e,n){const r=ie(t);try{const i=await function(o,l){const u=ie(o);return u.persistence.runTransaction("Reject batch","readwrite-primary",d=>{let p;return u.mutationQueue.lookupMutationBatch(d,l).next(m=>(ve(m!==null,37113),p=m.keys(),u.mutationQueue.removeMutationBatch(d,m))).next(()=>u.mutationQueue.performConsistencyCheck(d)).next(()=>u.documentOverlayCache.removeOverlaysForBatchId(d,p,l)).next(()=>u.localDocuments.recalculateAndSaveOverlaysForDocumentKeys(d,p)).next(()=>u.localDocuments.getDocuments(d,p))})}(r.localStore,e);M1(r,e,n),D1(r,e),r.sharedClientState.updateMutationState(e,"rejected",n),await Pa(r,i)}catch(i){await Hs(i)}}function D1(t,e){(t.mu.get(e)||[]).forEach(n=>{n.resolve()}),t.mu.delete(e)}function M1(t,e,n){const r=ie(t);let i=r.du[r.currentUser.toKey()];if(i){const s=i.get(e);s&&(n?s.reject(n):s.resolve(),i=i.remove(e)),r.du[r.currentUser.toKey()]=i}}function dh(t,e,n=null){t.sharedClientState.removeLocalQueryTarget(e);for(const r of t.Eu.get(e))t.Tu.delete(r),n&&t.Pu.yu(r,n);t.Eu.delete(e),t.isPrimaryClient&&t.Vu.Gr(e).forEach(r=>{t.Vu.containsKey(r)||L1(t,r)})}function L1(t,e){t.Iu.delete(e.path.canonicalString());const n=t.Ru.get(e);n!==null&&(Nf(t.remoteStore,n),t.Ru=t.Ru.remove(e),t.Au.delete(n),zf(t))}function kg(t,e,n){for(const r of n)r instanceof R1?(t.Vu.addReference(r.key,e),vS(t,r)):r instanceof P1?(K(Ff,"Document no longer in limbo: "+r.key),t.Vu.removeReference(r.key,e),t.Vu.containsKey(r.key)||L1(t,r.key)):ee(19791,{wu:r})}function vS(t,e){const n=e.key,r=n.path.canonicalString();t.Ru.get(n)||t.Iu.has(r)||(K(Ff,"New document in limbo: "+n),t.Iu.add(r),zf(t))}function zf(t){for(;t.Iu.size>0&&t.Ru.size<t.maxConcurrentLimboResolutions;){const e=t.Iu.values().next().value;t.Iu.delete(e);const n=new X(Ee.fromString(e)),r=t.fu.next();t.Au.set(r,new aS(n)),t.Ru=t.Ru.insert(n,r),T1(t.remoteStore,new Ar(jn(Wv(n.path)),r,"TargetPurposeLimboResolution",qu.ce))}}async function Pa(t,e,n){const r=ie(t),i=[],s=[],o=[];r.Tu.isEmpty()||(r.Tu.forEach((l,u)=>{o.push(r.pu(u,e,n).then(d=>{var p;if((d||n)&&r.isPrimaryClient){const m=d?!d.fromCache:(p=n==null?void 0:n.targetChanges.get(u.targetId))==null?void 0:p.current;r.sharedClientState.updateQueryState(u.targetId,m?"current":"not-current")}if(d){i.push(d);const m=Rf.Is(u.targetId,d);s.push(m)}}))}),await Promise.all(o),r.Pu.H_(i),await async function(u,d){const p=ie(u);try{await p.persistence.runTransaction("notifyLocalViewChanges","readwrite",m=>j.forEach(d,v=>j.forEach(v.Ts,I=>p.persistence.referenceDelegate.addReference(m,v.targetId,I)).next(()=>j.forEach(v.Es,I=>p.persistence.referenceDelegate.removeReference(m,v.targetId,I)))))}catch(m){if(!Ws(m))throw m;K(Pf,"Failed to update sequence numbers: "+m)}for(const m of d){const v=m.targetId;if(!m.fromCache){const I=p.vs.get(v),A=I.snapshotVersion,P=I.withLastLimboFreeSnapshotVersion(A);p.vs=p.vs.insert(v,P)}}}(r.localStore,s))}async function _S(t,e){const n=ie(t);if(!n.currentUser.isEqual(e)){K(Ff,"User change. New user:",e.toKey());const r=await w1(n.localStore,e);n.currentUser=e,function(s,o){s.mu.forEach(l=>{l.forEach(u=>{u.reject(new G(L.CANCELLED,o))})}),s.mu.clear()}(n,"'waitForPendingWrites' promise is rejected due to a user change."),n.sharedClientState.handleUserChange(e,r.removedBatchIds,r.addedBatchIds),await Pa(n,r.Ns)}}function wS(t,e){const n=ie(t),r=n.Au.get(e);if(r&&r.hu)return ue().add(r.key);{let i=ue();const s=n.Eu.get(e);if(!s)return i;for(const o of s){const l=n.Tu.get(o);i=i.unionWith(l.view.nu)}return i}}function j1(t){const e=ie(t);return e.remoteStore.remoteSyncer.applyRemoteEvent=V1.bind(null,e),e.remoteStore.remoteSyncer.getRemoteKeysForTarget=wS.bind(null,e),e.remoteStore.remoteSyncer.rejectListen=mS.bind(null,e),e.Pu.H_=nS.bind(null,e.eventManager),e.Pu.yu=rS.bind(null,e.eventManager),e}function xS(t){const e=ie(t);return e.remoteStore.remoteSyncer.applySuccessfulWrite=gS.bind(null,e),e.remoteStore.remoteSyncer.rejectFailedWrite=yS.bind(null,e),e}class Eu{constructor(){this.kind="memory",this.synchronizeTabs=!1}async initialize(e){this.serializer=Ju(e.databaseInfo.databaseId),this.sharedClientState=this.Du(e),this.persistence=this.Cu(e),await this.persistence.start(),this.localStore=this.vu(e),this.gcScheduler=this.Fu(e,this.localStore),this.indexBackfillerScheduler=this.Mu(e,this.localStore)}Fu(e,n){return null}Mu(e,n){return null}vu(e){return xT(this.persistence,new vT,e.initialUser,this.serializer)}Cu(e){return new _1(Cf.Vi,this.serializer)}Du(e){return new AT}async terminate(){var e,n;(e=this.gcScheduler)==null||e.stop(),(n=this.indexBackfillerScheduler)==null||n.stop(),this.sharedClientState.shutdown(),await this.persistence.shutdown()}}Eu.provider={build:()=>new Eu};class ES extends Eu{constructor(e){super(),this.cacheSizeBytes=e}Fu(e,n){ve(this.persistence.referenceDelegate instanceof wu,46915);const r=this.persistence.referenceDelegate.garbageCollector;return new rT(r,e.asyncQueue,n)}Cu(e){const n=this.cacheSizeBytes!==void 0?Nt.withCacheSize(this.cacheSizeBytes):Nt.DEFAULT;return new _1(r=>wu.Vi(r,n),this.serializer)}}class hh{async initialize(e,n){this.localStore||(this.localStore=e.localStore,this.sharedClientState=e.sharedClientState,this.datastore=this.createDatastore(n),this.remoteStore=this.createRemoteStore(n),this.eventManager=this.createEventManager(n),this.syncEngine=this.createSyncEngine(n,!e.synchronizeTabs),this.sharedClientState.onlineStateHandler=r=>Sg(this.syncEngine,r,1),this.remoteStore.remoteSyncer.handleCredentialChange=_S.bind(null,this.syncEngine),await XT(this.remoteStore,this.syncEngine.isPrimaryClient))}createEventManager(e){return function(){return new ZT}()}createDatastore(e){const n=Ju(e.databaseInfo.databaseId),r=VT(e.databaseInfo);return OT(e.authCredentials,e.appCheckCredentials,r,n)}createRemoteStore(e){return function(r,i,s,o,l){return new zT(r,i,s,o,l)}(this.localStore,this.datastore,e.asyncQueue,n=>Sg(this.syncEngine,n,0),function(){return _g.v()?new _g:new CT}())}createSyncEngine(e,n){return function(i,s,o,l,u,d,p){const m=new lS(i,s,o,l,u,d);return p&&(m.gu=!0),m}(this.localStore,this.remoteStore,this.eventManager,this.sharedClientState,e.initialUser,e.maxConcurrentLimboResolutions,n)}async terminate(){var e,n;await async function(i){const s=ie(i);K(Di,"RemoteStore shutting down."),s.Ia.add(5),await Ra(s),s.Aa.shutdown(),s.Va.set("Unknown")}(this.remoteStore),(e=this.datastore)==null||e.terminate(),(n=this.eventManager)==null||n.terminate()}}hh.provider={build:()=>new hh};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *//**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class bS{constructor(e){this.observer=e,this.muted=!1}next(e){this.muted||this.observer.next&&this.Ou(this.observer.next,e)}error(e){this.muted||(this.observer.error?this.Ou(this.observer.error,e):nr("Uncaught Error in snapshot listener:",e.toString()))}Nu(){this.muted=!0}Ou(e,n){setTimeout(()=>{this.muted||e(n)},0)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Qr="FirestoreClient";class TS{constructor(e,n,r,i,s){this.authCredentials=e,this.appCheckCredentials=n,this.asyncQueue=r,this._databaseInfo=i,this.user=_t.UNAUTHENTICATED,this.clientId=vf.newId(),this.authCredentialListener=()=>Promise.resolve(),this.appCheckCredentialListener=()=>Promise.resolve(),this._uninitializedComponentsProvider=s,this.authCredentials.start(r,async o=>{K(Qr,"Received user=",o.uid),await this.authCredentialListener(o),this.user=o}),this.appCheckCredentials.start(r,o=>(K(Qr,"Received new app check token=",o),this.appCheckCredentialListener(o,this.user)))}get configuration(){return{asyncQueue:this.asyncQueue,databaseInfo:this._databaseInfo,clientId:this.clientId,authCredentials:this.authCredentials,appCheckCredentials:this.appCheckCredentials,initialUser:this.user,maxConcurrentLimboResolutions:100}}setCredentialChangeListener(e){this.authCredentialListener=e}setAppCheckTokenChangeListener(e){this.appCheckCredentialListener=e}terminate(){this.asyncQueue.enterRestrictedMode();const e=new zr;return this.asyncQueue.enqueueAndForgetEvenWhileRestricted(async()=>{try{this._onlineComponents&&await this._onlineComponents.terminate(),this._offlineComponents&&await this._offlineComponents.terminate(),this.authCredentials.shutdown(),this.appCheckCredentials.shutdown(),e.resolve()}catch(n){const r=jf(n,"Failed to shutdown persistence");e.reject(r)}}),e.promise}}async function Yc(t,e){t.asyncQueue.verifyOperationInProgress(),K(Qr,"Initializing OfflineComponentProvider");const n=t.configuration;await e.initialize(n);let r=n.initialUser;t.setCredentialChangeListener(async i=>{r.isEqual(i)||(await w1(e.localStore,i),r=i)}),e.persistence.setDatabaseDeletedListener(()=>t.terminate()),t._offlineComponents=e}async function Ig(t,e){t.asyncQueue.verifyOperationInProgress();const n=await SS(t);K(Qr,"Initializing OnlineComponentProvider"),await e.initialize(n,t.configuration),t.setCredentialChangeListener(r=>xg(e.remoteStore,r)),t.setAppCheckTokenChangeListener((r,i)=>xg(e.remoteStore,i)),t._onlineComponents=e}async function SS(t){if(!t._offlineComponents)if(t._uninitializedComponentsProvider){K(Qr,"Using user provided OfflineComponentProvider");try{await Yc(t,t._uninitializedComponentsProvider._offline)}catch(e){const n=e;if(!function(i){return i.name==="FirebaseError"?i.code===L.FAILED_PRECONDITION||i.code===L.UNIMPLEMENTED:!(typeof DOMException<"u"&&i instanceof DOMException)||i.code===22||i.code===20||i.code===11}(n))throw n;Vi("Error using user provided cache. Falling back to memory cache: "+n),await Yc(t,new Eu)}}else K(Qr,"Using default OfflineComponentProvider"),await Yc(t,new ES(void 0));return t._offlineComponents}async function O1(t){return t._onlineComponents||(t._uninitializedComponentsProvider?(K(Qr,"Using user provided OnlineComponentProvider"),await Ig(t,t._uninitializedComponentsProvider._online)):(K(Qr,"Using default OnlineComponentProvider"),await Ig(t,new hh))),t._onlineComponents}function kS(t){return O1(t).then(e=>e.syncEngine)}async function IS(t){const e=await O1(t),n=e.eventManager;return n.onListen=uS.bind(null,e.syncEngine),n.onUnlisten=hS.bind(null,e.syncEngine),n.onFirstRemoteStoreListen=cS.bind(null,e.syncEngine),n.onLastRemoteStoreUnlisten=fS.bind(null,e.syncEngine),n}function AS(t,e,n={}){const r=new zr;return t.asyncQueue.enqueueAndForget(async()=>function(s,o,l,u,d){const p=new bS({next:v=>{p.Nu(),o.enqueueAndForget(()=>tS(s,m)),v.fromCache&&u.source==="server"?d.reject(new G(L.UNAVAILABLE,'Failed to get documents from server. (However, these documents may exist in the local cache. Run again without setting source to "server" to retrieve the cached documents.)')):d.resolve(v)},error:v=>d.reject(v)}),m=new iS(l,p,{includeMetadataChanges:!0,qa:!0});return eS(s,m)}(await IS(t),t.asyncQueue,e,n,r)),r.promise}function CS(t,e){const n=new zr;return t.asyncQueue.enqueueAndForget(async()=>pS(await kS(t),e,n)),n.promise}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function F1(t){const e={};return t.timeoutSeconds!==void 0&&(e.timeoutSeconds=t.timeoutSeconds),e}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const RS="ComponentProvider",Ag=new Map;function PS(t,e,n,r,i){return new WE(t,e,n,i.host,i.ssl,i.experimentalForceLongPolling,i.experimentalAutoDetectLongPolling,F1(i.experimentalLongPollingOptions),i.useFetchStreams,i.isUsingEmulator,r)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const z1="firestore.googleapis.com",Cg=!0;class Rg{constructor(e){if(e.host===void 0){if(e.ssl!==void 0)throw new G(L.INVALID_ARGUMENT,"Can't provide ssl option if host option is not set");this.host=z1,this.ssl=Cg}else this.host=e.host,this.ssl=e.ssl??Cg;if(this.isUsingEmulator=e.emulatorOptions!==void 0,this.credentials=e.credentials,this.ignoreUndefinedProperties=!!e.ignoreUndefinedProperties,this.localCache=e.localCache,e.cacheSizeBytes===void 0)this.cacheSizeBytes=v1;else{if(e.cacheSizeBytes!==-1&&e.cacheSizeBytes<tT)throw new G(L.INVALID_ARGUMENT,"cacheSizeBytes must be at least 1048576");this.cacheSizeBytes=e.cacheSizeBytes}DE("experimentalForceLongPolling",e.experimentalForceLongPolling,"experimentalAutoDetectLongPolling",e.experimentalAutoDetectLongPolling),this.experimentalForceLongPolling=!!e.experimentalForceLongPolling,this.experimentalForceLongPolling?this.experimentalAutoDetectLongPolling=!1:e.experimentalAutoDetectLongPolling===void 0?this.experimentalAutoDetectLongPolling=!0:this.experimentalAutoDetectLongPolling=!!e.experimentalAutoDetectLongPolling,this.experimentalLongPollingOptions=F1(e.experimentalLongPollingOptions??{}),function(r){if(r.timeoutSeconds!==void 0){if(isNaN(r.timeoutSeconds))throw new G(L.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (must not be NaN)`);if(r.timeoutSeconds<5)throw new G(L.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (minimum allowed value is 5)`);if(r.timeoutSeconds>30)throw new G(L.INVALID_ARGUMENT,`invalid long polling timeout: ${r.timeoutSeconds} (maximum allowed value is 30)`)}}(this.experimentalLongPollingOptions),this.useFetchStreams=!!e.useFetchStreams}isEqual(e){return this.host===e.host&&this.ssl===e.ssl&&this.credentials===e.credentials&&this.cacheSizeBytes===e.cacheSizeBytes&&this.experimentalForceLongPolling===e.experimentalForceLongPolling&&this.experimentalAutoDetectLongPolling===e.experimentalAutoDetectLongPolling&&function(r,i){return r.timeoutSeconds===i.timeoutSeconds}(this.experimentalLongPollingOptions,e.experimentalLongPollingOptions)&&this.ignoreUndefinedProperties===e.ignoreUndefinedProperties&&this.useFetchStreams===e.useFetchStreams}}class tc{constructor(e,n,r,i){this._authCredentials=e,this._appCheckCredentials=n,this._databaseId=r,this._app=i,this.type="firestore-lite",this._persistenceKey="(lite)",this._settings=new Rg({}),this._settingsFrozen=!1,this._emulatorOptions={},this._terminateTask="notTerminated"}get app(){if(!this._app)throw new G(L.FAILED_PRECONDITION,"Firestore was not initialized using the Firebase SDK. 'app' is not available");return this._app}get _initialized(){return this._settingsFrozen}get _terminated(){return this._terminateTask!=="notTerminated"}_setSettings(e){if(this._settingsFrozen)throw new G(L.FAILED_PRECONDITION,"Firestore has already been started and its settings can no longer be changed. You can only modify settings before calling any other methods on a Firestore object.");this._settings=new Rg(e),this._emulatorOptions=e.emulatorOptions||{},e.credentials!==void 0&&(this._authCredentials=function(r){if(!r)return new TE;switch(r.type){case"firstParty":return new AE(r.sessionIndex||"0",r.iamToken||null,r.authTokenFactory||null);case"provider":return r.client;default:throw new G(L.INVALID_ARGUMENT,"makeAuthCredentialsProvider failed due to invalid credential type")}}(e.credentials))}_getSettings(){return this._settings}_getEmulatorOptions(){return this._emulatorOptions}_freezeSettings(){return this._settingsFrozen=!0,this._settings}_delete(){return this._terminateTask==="notTerminated"&&(this._terminateTask=this._terminate()),this._terminateTask}async _restart(){this._terminateTask==="notTerminated"?await this._terminate():this._terminateTask="notTerminated"}toJSON(){return{app:this._app,databaseId:this._databaseId,settings:this._settings}}_terminate(){return function(n){const r=Ag.get(n);r&&(K(RS,"Removing Datastore"),Ag.delete(n),r.terminate())}(this),Promise.resolve()}}function NS(t,e,n,r={}){var d;t=hu(t,tc);const i=fv(e),s=t._getSettings(),o={...s,emulatorOptions:t._getEmulatorOptions()},l=`${e}:${n}`;i&&l2(`https://${l}`),s.host!==z1&&s.host!==l&&Vi("Host has been set in both settings() and connectFirestoreEmulator(), emulator host will be used.");const u={...s,host:l,ssl:i,emulatorOptions:r};if(!cu(u,o)&&(t._setSettings(u),r.mockUserToken)){let p,m;if(typeof r.mockUserToken=="string")p=r.mockUserToken,m=_t.MOCK_USER;else{p=Zx(r.mockUserToken,(d=t._app)==null?void 0:d.options.projectId);const v=r.mockUserToken.sub||r.mockUserToken.user_id;if(!v)throw new G(L.INVALID_ARGUMENT,"mockUserToken must contain 'sub' or 'user_id' field!");m=new _t(v)}t._authCredentials=new SE(new Iv(p,m))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zr{constructor(e,n,r){this.converter=n,this._query=r,this.type="query",this.firestore=e}withConverter(e){return new Zr(this.firestore,e,this._query)}}class at{constructor(e,n,r){this.converter=n,this._key=r,this.type="document",this.firestore=e}get _path(){return this._key.path}get id(){return this._key.path.lastSegment()}get path(){return this._key.path.canonicalString()}get parent(){return new Ur(this.firestore,this.converter,this._key.path.popLast())}withConverter(e){return new at(this.firestore,e,this._key)}toJSON(){return{type:at._jsonSchemaVersion,referencePath:this._key.toString()}}static fromJSON(e,n,r){if(Ia(n,at._jsonSchema))return new at(e,r||null,new X(Ee.fromString(n.referencePath)))}}at._jsonSchemaVersion="firestore/documentReference/1.0",at._jsonSchema={type:Ge("string",at._jsonSchemaVersion),referencePath:Ge("string")};class Ur extends Zr{constructor(e,n,r){super(e,n,Wv(r)),this._path=r,this.type="collection"}get id(){return this._query.path.lastSegment()}get path(){return this._query.path.canonicalString()}get parent(){const e=this._path.popLast();return e.isEmpty()?null:new at(this.firestore,null,new X(e))}withConverter(e){return new Ur(this.firestore,e,this._path)}}function nc(t,e,...n){if(t=Ds(t),Av("collection","path",e),t instanceof tc){const r=Ee.fromString(e,...n);return $m(r),new Ur(t,null,r)}{if(!(t instanceof at||t instanceof Ur))throw new G(L.INVALID_ARGUMENT,"Expected first argument to collection() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=t._path.child(Ee.fromString(e,...n));return $m(r),new Ur(t.firestore,null,r)}}function VS(t,e,...n){if(t=Ds(t),arguments.length===1&&(e=vf.newId()),Av("doc","path",e),t instanceof tc){const r=Ee.fromString(e,...n);return Bm(r),new at(t,null,new X(r))}{if(!(t instanceof at||t instanceof Ur))throw new G(L.INVALID_ARGUMENT,"Expected first argument to doc() to be a CollectionReference, a DocumentReference or FirebaseFirestore");const r=t._path.child(Ee.fromString(e,...n));return Bm(r),new at(t.firestore,t instanceof Ur?t.converter:null,new X(r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pg="AsyncQueue";class Ng{constructor(e=Promise.resolve()){this.Yu=[],this.ec=!1,this.tc=[],this.nc=null,this.rc=!1,this.sc=!1,this.oc=[],this.M_=new E1(this,"async_queue_retry"),this._c=()=>{const r=Qc();r&&K(Pg,"Visibility state changed to "+r.visibilityState),this.M_.w_()},this.ac=e;const n=Qc();n&&typeof n.addEventListener=="function"&&n.addEventListener("visibilitychange",this._c)}get isShuttingDown(){return this.ec}enqueueAndForget(e){this.enqueue(e)}enqueueAndForgetEvenWhileRestricted(e){this.uc(),this.cc(e)}enterRestrictedMode(e){if(!this.ec){this.ec=!0,this.sc=e||!1;const n=Qc();n&&typeof n.removeEventListener=="function"&&n.removeEventListener("visibilitychange",this._c)}}enqueue(e){if(this.uc(),this.ec)return new Promise(()=>{});const n=new zr;return this.cc(()=>this.ec&&this.sc?Promise.resolve():(e().then(n.resolve,n.reject),n.promise)).then(()=>n.promise)}enqueueRetryable(e){this.enqueueAndForget(()=>(this.Yu.push(e),this.lc()))}async lc(){if(this.Yu.length!==0){try{await this.Yu[0](),this.Yu.shift(),this.M_.reset()}catch(e){if(!Ws(e))throw e;K(Pg,"Operation failed with retryable error: "+e)}this.Yu.length>0&&this.M_.p_(()=>this.lc())}}cc(e){const n=this.ac.then(()=>(this.rc=!0,e().catch(r=>{throw this.nc=r,this.rc=!1,nr("INTERNAL UNHANDLED ERROR: ",Vg(r)),r}).then(r=>(this.rc=!1,r))));return this.ac=n,n}enqueueAfterDelay(e,n,r){this.uc(),this.oc.indexOf(e)>-1&&(n=0);const i=Lf.createAndSchedule(this,e,n,r,s=>this.hc(s));return this.tc.push(i),i}uc(){this.nc&&ee(47125,{Pc:Vg(this.nc)})}verifyOperationInProgress(){}async Tc(){let e;do e=this.ac,await e;while(e!==this.ac)}Ec(e){for(const n of this.tc)if(n.timerId===e)return!0;return!1}Ic(e){return this.Tc().then(()=>{this.tc.sort((n,r)=>n.targetTimeMs-r.targetTimeMs);for(const n of this.tc)if(n.skipDelay(),e!=="all"&&n.timerId===e)break;return this.Tc()})}Rc(e){this.oc.push(e)}hc(e){const n=this.tc.indexOf(e);this.tc.splice(n,1)}}function Vg(t){let e=t.message||"";return t.stack&&(e=t.stack.includes(t.message)?t.stack:t.message+`
`+t.stack),e}class Uf extends tc{constructor(e,n,r,i){super(e,n,r,i),this.type="firestore",this._queue=new Ng,this._persistenceKey=(i==null?void 0:i.name)||"[DEFAULT]"}async _terminate(){if(this._firestoreClient){const e=this._firestoreClient.terminate();this._queue=new Ng(e),this._firestoreClient=void 0,await e}}}function DS(t,e){const n=typeof t=="object"?t:cE(),r=typeof t=="string"?t:pu,i=sE(n,"firestore").getImmediate({identifier:r});if(!i._initialized){const s=Xx("firestore");s&&NS(i,...s)}return i}function U1(t){if(t._terminated)throw new G(L.FAILED_PRECONDITION,"The client has already been terminated.");return t._firestoreClient||MS(t),t._firestoreClient}function MS(t){var r,i,s,o;const e=t._freezeSettings(),n=PS(t._databaseId,((r=t._app)==null?void 0:r.options.appId)||"",t._persistenceKey,(i=t._app)==null?void 0:i.options.apiKey,e);t._componentsProvider||(s=e.localCache)!=null&&s._offlineComponentProvider&&((o=e.localCache)!=null&&o._onlineComponentProvider)&&(t._componentsProvider={_offline:e.localCache._offlineComponentProvider,_online:e.localCache._onlineComponentProvider}),t._firestoreClient=new TS(t._authCredentials,t._appCheckCredentials,t._queue,n,t._componentsProvider&&function(u){const d=u==null?void 0:u._online.build();return{_offline:u==null?void 0:u._offline.build(d),_online:d}}(t._componentsProvider))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rn{constructor(e){this._byteString=e}static fromBase64String(e){try{return new rn(mt.fromBase64String(e))}catch(n){throw new G(L.INVALID_ARGUMENT,"Failed to construct data from Base64 string: "+n)}}static fromUint8Array(e){return new rn(mt.fromUint8Array(e))}toBase64(){return this._byteString.toBase64()}toUint8Array(){return this._byteString.toUint8Array()}toString(){return"Bytes(base64: "+this.toBase64()+")"}isEqual(e){return this._byteString.isEqual(e._byteString)}toJSON(){return{type:rn._jsonSchemaVersion,bytes:this.toBase64()}}static fromJSON(e){if(Ia(e,rn._jsonSchema))return rn.fromBase64String(e.bytes)}}rn._jsonSchemaVersion="firestore/bytes/1.0",rn._jsonSchema={type:Ge("string",rn._jsonSchemaVersion),bytes:Ge("string")};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class B1{constructor(...e){for(let n=0;n<e.length;++n)if(e[n].length===0)throw new G(L.INVALID_ARGUMENT,"Invalid field name at argument $(i + 1). Field names must not be empty.");this._internalPath=new ht(e)}isEqual(e){return this._internalPath.isEqual(e._internalPath)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bf{constructor(e){this._methodName=e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Fn{constructor(e,n){if(!isFinite(e)||e<-90||e>90)throw new G(L.INVALID_ARGUMENT,"Latitude must be a number between -90 and 90, but was: "+e);if(!isFinite(n)||n<-180||n>180)throw new G(L.INVALID_ARGUMENT,"Longitude must be a number between -180 and 180, but was: "+n);this._lat=e,this._long=n}get latitude(){return this._lat}get longitude(){return this._long}isEqual(e){return this._lat===e._lat&&this._long===e._long}_compareTo(e){return le(this._lat,e._lat)||le(this._long,e._long)}toJSON(){return{latitude:this._lat,longitude:this._long,type:Fn._jsonSchemaVersion}}static fromJSON(e){if(Ia(e,Fn._jsonSchema))return new Fn(e.latitude,e.longitude)}}Fn._jsonSchemaVersion="firestore/geoPoint/1.0",Fn._jsonSchema={type:Ge("string",Fn._jsonSchemaVersion),latitude:Ge("number"),longitude:Ge("number")};/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xn{constructor(e){this._values=(e||[]).map(n=>n)}toArray(){return this._values.map(e=>e)}isEqual(e){return function(r,i){if(r.length!==i.length)return!1;for(let s=0;s<r.length;++s)if(r[s]!==i[s])return!1;return!0}(this._values,e._values)}toJSON(){return{type:xn._jsonSchemaVersion,vectorValues:this._values}}static fromJSON(e){if(Ia(e,xn._jsonSchema)){if(Array.isArray(e.vectorValues)&&e.vectorValues.every(n=>typeof n=="number"))return new xn(e.vectorValues);throw new G(L.INVALID_ARGUMENT,"Expected 'vectorValues' field to be a number array")}}}xn._jsonSchemaVersion="firestore/vectorValue/1.0",xn._jsonSchema={type:Ge("string",xn._jsonSchemaVersion),vectorValues:Ge("object")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const LS=/^__.*__$/;class jS{constructor(e,n,r){this.data=e,this.fieldMask=n,this.fieldTransforms=r}toMutation(e,n){return this.fieldMask!==null?new Fi(e,this.data,this.fieldMask,n,this.fieldTransforms):new Aa(e,this.data,n,this.fieldTransforms)}}function $1(t){switch(t){case 0:case 2:case 1:return!0;case 3:case 4:return!1;default:throw ee(40011,{dataSource:t})}}class $f{constructor(e,n,r,i,s,o){this.settings=e,this.databaseId=n,this.serializer=r,this.ignoreUndefinedProperties=i,s===void 0&&this.Ac(),this.fieldTransforms=s||[],this.fieldMask=o||[]}get path(){return this.settings.path}get dataSource(){return this.settings.dataSource}i(e){return new $f({...this.settings,...e},this.databaseId,this.serializer,this.ignoreUndefinedProperties,this.fieldTransforms,this.fieldMask)}dc(e){var i;const n=(i=this.path)==null?void 0:i.child(e),r=this.i({path:n,arrayElement:!1});return r.mc(e),r}fc(e){var i;const n=(i=this.path)==null?void 0:i.child(e),r=this.i({path:n,arrayElement:!1});return r.Ac(),r}gc(e){return this.i({path:void 0,arrayElement:!0})}yc(e){return bu(e,this.settings.methodName,this.settings.hasConverter||!1,this.path,this.settings.targetDoc)}contains(e){return this.fieldMask.find(n=>e.isPrefixOf(n))!==void 0||this.fieldTransforms.find(n=>e.isPrefixOf(n.field))!==void 0}Ac(){if(this.path)for(let e=0;e<this.path.length;e++)this.mc(this.path.get(e))}mc(e){if(e.length===0)throw this.yc("Document fields must not be empty");if($1(this.dataSource)&&LS.test(e))throw this.yc('Document fields cannot begin and end with "__"')}}class OS{constructor(e,n,r){this.databaseId=e,this.ignoreUndefinedProperties=n,this.serializer=r||Ju(e)}I(e,n,r,i=!1){return new $f({dataSource:e,methodName:n,targetDoc:r,path:ht.emptyPath(),arrayElement:!1,hasConverter:i},this.databaseId,this.serializer,this.ignoreUndefinedProperties)}}function q1(t){const e=t._freezeSettings(),n=Ju(t._databaseId);return new OS(t._databaseId,!!e.ignoreUndefinedProperties,n)}function FS(t,e,n,r,i,s={}){const o=t.I(s.merge||s.mergeFields?2:0,e,n,i);G1("Data must be an object, but it was:",o,r);const l=H1(r,o);let u,d;if(s.merge)u=new vn(o.fieldMask),d=o.fieldTransforms;else if(s.mergeFields){const p=[];for(const m of s.mergeFields){const v=rc(e,m,n);if(!o.contains(v))throw new G(L.INVALID_ARGUMENT,`Field '${v}' is specified in your field mask but missing from your input data.`);$S(p,v)||p.push(v)}u=new vn(p),d=o.fieldTransforms.filter(m=>u.covers(m.field))}else u=null,d=o.fieldTransforms;return new jS(new nn(l),u,d)}class qf extends Bf{_toFieldTransform(e){return new xb(e.path,new va)}isEqual(e){return e instanceof qf}}function zS(t,e,n,r=!1){return Hf(n,t.I(r?4:3,e))}function Hf(t,e){if(W1(t=Ds(t)))return G1("Unsupported field value:",e,t),H1(t,e);if(t instanceof Bf)return function(r,i){if(!$1(i.dataSource))throw i.yc(`${r._methodName}() can only be used with update() and set()`);if(!i.path)throw i.yc(`${r._methodName}() is not currently supported inside arrays`);const s=r._toFieldTransform(i);s&&i.fieldTransforms.push(s)}(t,e),null;if(t===void 0&&e.ignoreUndefinedProperties)return null;if(e.path&&e.fieldMask.push(e.path),t instanceof Array){if(e.settings.arrayElement&&e.dataSource!==4)throw e.yc("Nested arrays are not supported");return function(r,i){const s=[];let o=0;for(const l of r){let u=Hf(l,i.gc(o));u==null&&(u={nullValue:"NULL_VALUE"}),s.push(u),o++}return{arrayValue:{values:s}}}(t,e)}return function(r,i){if((r=Ds(r))===null)return{nullValue:"NULL_VALUE"};if(typeof r=="number")return vb(i.serializer,r);if(typeof r=="boolean")return{booleanValue:r};if(typeof r=="string")return{stringValue:r};if(r instanceof Date){const s=ke.fromDate(r);return{timestampValue:_u(i.serializer,s)}}if(r instanceof ke){const s=new ke(r.seconds,1e3*Math.floor(r.nanoseconds/1e3));return{timestampValue:_u(i.serializer,s)}}if(r instanceof Fn)return{geoPointValue:{latitude:r.latitude,longitude:r.longitude}};if(r instanceof rn)return{bytesValue:c1(i.serializer,r._byteString)};if(r instanceof at){const s=i.databaseId,o=r.firestore._databaseId;if(!o.isEqual(s))throw i.yc(`Document reference is for database ${o.projectId}/${o.database} but should be for database ${s.projectId}/${s.database}`);return{referenceValue:If(r.firestore._databaseId||i.databaseId,r._key.path)}}if(r instanceof xn)return function(o,l){const u=o instanceof xn?o.toArray():o;return{mapValue:{fields:{[jv]:{stringValue:Ov},[mu]:{arrayValue:{values:u.map(p=>{if(typeof p!="number")throw l.yc("VectorValues must only contain numeric values.");return Tf(l.serializer,p)})}}}}}}(r,i);if(y1(r))return r._toProto(i.serializer);throw i.yc(`Unsupported field value: ${$u(r)}`)}(t,e)}function H1(t,e){const n={};return Pv(t)?e.path&&e.path.length>0&&e.fieldMask.push(e.path):ji(t,(r,i)=>{const s=Hf(i,e.dc(r));s!=null&&(n[r]=s)}),{mapValue:{fields:n}}}function W1(t){return!(typeof t!="object"||t===null||t instanceof Array||t instanceof Date||t instanceof ke||t instanceof Fn||t instanceof rn||t instanceof at||t instanceof Bf||t instanceof xn||y1(t))}function G1(t,e,n){if(!W1(n)||!Cv(n)){const r=$u(n);throw r==="an object"?e.yc(t+" a custom object"):e.yc(t+" "+r)}}function rc(t,e,n){if((e=Ds(e))instanceof B1)return e._internalPath;if(typeof e=="string")return BS(t,e);throw bu("Field path arguments must be of type string or ",t,!1,void 0,n)}const US=new RegExp("[~\\*/\\[\\]]");function BS(t,e,n){if(e.search(US)>=0)throw bu(`Invalid field path (${e}). Paths must not contain '~', '*', '/', '[', or ']'`,t,!1,void 0,n);try{return new B1(...e.split("."))._internalPath}catch{throw bu(`Invalid field path (${e}). Paths must not be empty, begin with '.', end with '.', or contain '..'`,t,!1,void 0,n)}}function bu(t,e,n,r,i){const s=r&&!r.isEmpty(),o=i!==void 0;let l=`Function ${e}() called with invalid data`;n&&(l+=" (via `toFirestore()`)"),l+=". ";let u="";return(s||o)&&(u+=" (found",s&&(u+=` in field ${r}`),o&&(u+=` in document ${i}`),u+=")"),new G(L.INVALID_ARGUMENT,l+t+u)}function $S(t,e){return t.some(n=>n.isEqual(e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qS{convertValue(e,n="none"){switch(Gr(e)){case 0:return null;case 1:return e.booleanValue;case 2:return Ue(e.integerValue||e.doubleValue);case 3:return this.convertTimestamp(e.timestampValue);case 4:return this.convertServerTimestamp(e,n);case 5:return e.stringValue;case 6:return this.convertBytes(Wr(e.bytesValue));case 7:return this.convertReference(e.referenceValue);case 8:return this.convertGeoPoint(e.geoPointValue);case 9:return this.convertArray(e.arrayValue,n);case 11:return this.convertObject(e.mapValue,n);case 10:return this.convertVectorValue(e.mapValue);default:throw ee(62114,{value:e})}}convertObject(e,n){return this.convertObjectMap(e.fields,n)}convertObjectMap(e,n="none"){const r={};return ji(e,(i,s)=>{r[i]=this.convertValue(s,n)}),r}convertVectorValue(e){var r,i,s;const n=(s=(i=(r=e.fields)==null?void 0:r[mu].arrayValue)==null?void 0:i.values)==null?void 0:s.map(o=>Ue(o.doubleValue));return new xn(n)}convertGeoPoint(e){return new Fn(Ue(e.latitude),Ue(e.longitude))}convertArray(e,n){return(e.values||[]).map(r=>this.convertValue(r,n))}convertServerTimestamp(e,n){switch(n){case"previous":const r=Wu(e);return r==null?null:this.convertValue(r,n);case"estimate":return this.convertTimestamp(pa(e));default:return null}}convertTimestamp(e){const n=Hr(e);return new ke(n.seconds,n.nanos)}convertDocumentKey(e,n){const r=Ee.fromString(e);ve(g1(r),9688,{name:e});const i=new ma(r.get(1),r.get(3)),s=new X(r.popFirst(5));return i.isEqual(n)||nr(`Document ${s} contains a document reference within a different database (${i.projectId}/${i.database}) which is not supported. It will be treated as a reference in the current database (${n.projectId}/${n.database}) instead.`),s}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class HS extends qS{constructor(e){super(),this.firestore=e}convertBytes(e){return new rn(e)}convertReference(e){const n=this.convertDocumentKey(e,this.firestore._databaseId);return new at(this.firestore,null,n)}}function K1(){return new qf("serverTimestamp")}const Dg="@firebase/firestore",Mg="4.14.0";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Q1{constructor(e,n,r,i,s){this._firestore=e,this._userDataWriter=n,this._key=r,this._document=i,this._converter=s}get id(){return this._key.path.lastSegment()}get ref(){return new at(this._firestore,this._converter,this._key)}exists(){return this._document!==null}data(){if(this._document){if(this._converter){const e=new WS(this._firestore,this._userDataWriter,this._key,this._document,null);return this._converter.fromFirestore(e)}return this._userDataWriter.convertValue(this._document.data.value)}}_fieldsProto(){var e;return((e=this._document)==null?void 0:e.data.clone().value.mapValue.fields)??void 0}get(e){if(this._document){const n=this._document.data.field(rc("DocumentSnapshot.get",e));if(n!==null)return this._userDataWriter.convertValue(n)}}}class WS extends Q1{data(){return super.data()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function GS(t){if(t.limitType==="L"&&t.explicitOrderBy.length===0)throw new G(L.UNIMPLEMENTED,"limitToLast() queries require specifying at least one orderBy() clause")}class Wf{}class Gf extends Wf{}function Kf(t,e,...n){let r=[];e instanceof Wf&&r.push(e),r=r.concat(n),function(s){const o=s.filter(u=>u instanceof Yf).length,l=s.filter(u=>u instanceof Qf).length;if(o>1||o>0&&l>0)throw new G(L.INVALID_ARGUMENT,"InvalidQuery. When using composite filters, you cannot use more than one filter at the top level. Consider nesting the multiple filters within an `and(...)` statement. For example: change `query(query, where(...), or(...))` to `query(query, and(where(...), or(...)))`.")}(r);for(const i of r)t=i._apply(t);return t}class Qf extends Gf{constructor(e,n,r){super(),this._field=e,this._op=n,this._value=r,this.type="where"}static _create(e,n,r){return new Qf(e,n,r)}_apply(e){const n=this._parse(e);return Y1(e._query,n),new Zr(e.firestore,e.converter,rh(e._query,n))}_parse(e){const n=q1(e.firestore);return function(s,o,l,u,d,p,m){let v;if(d.isKeyField()){if(p==="array-contains"||p==="array-contains-any")throw new G(L.INVALID_ARGUMENT,`Invalid Query. You can't perform '${p}' queries on documentId().`);if(p==="in"||p==="not-in"){jg(m,p);const A=[];for(const P of m)A.push(Lg(u,s,P));v={arrayValue:{values:A}}}else v=Lg(u,s,m)}else p!=="in"&&p!=="not-in"&&p!=="array-contains-any"||jg(m,p),v=zS(l,o,m,p==="in"||p==="not-in");return We.create(d,p,v)}(e._query,"where",n,e.firestore._databaseId,this._field,this._op,this._value)}}class Yf extends Wf{constructor(e,n){super(),this.type=e,this._queryConstraints=n}static _create(e,n){return new Yf(e,n)}_parse(e){const n=this._queryConstraints.map(r=>r._parse(e)).filter(r=>r.getFilters().length>0);return n.length===1?n[0]:bn.create(n,this._getOperator())}_apply(e){const n=this._parse(e);return n.getFilters().length===0?e:(function(i,s){let o=i;const l=s.getFlattenedFilters();for(const u of l)Y1(o,u),o=rh(o,u)}(e._query,n),new Zr(e.firestore,e.converter,rh(e._query,n)))}_getQueryConstraints(){return this._queryConstraints}_getOperator(){return this.type==="and"?"and":"or"}}class Xf extends Gf{constructor(e,n){super(),this._field=e,this._direction=n,this.type="orderBy"}static _create(e,n){return new Xf(e,n)}_apply(e){const n=function(i,s,o){if(i.startAt!==null)throw new G(L.INVALID_ARGUMENT,"Invalid query. You must not call startAt() or startAfter() before calling orderBy().");if(i.endAt!==null)throw new G(L.INVALID_ARGUMENT,"Invalid query. You must not call endAt() or endBefore() before calling orderBy().");return new ya(s,o)}(e._query,this._field,this._direction);return new Zr(e.firestore,e.converter,cb(e._query,n))}}function Jf(t,e="asc"){const n=e,r=rc("orderBy",t);return Xf._create(r,n)}class Zf extends Gf{constructor(e,n,r){super(),this.type=e,this._limit=n,this._limitType=r}static _create(e,n,r){return new Zf(e,n,r)}_apply(e){return new Zr(e.firestore,e.converter,yu(e._query,this._limit,this._limitType))}}function ep(t){return ME("limit",t),Zf._create("limit",t,"F")}function Lg(t,e,n){if(typeof(n=Ds(n))=="string"){if(n==="")throw new G(L.INVALID_ARGUMENT,"Invalid query. When querying with documentId(), you must provide a valid document ID, but it was an empty string.");if(!Gv(e)&&n.indexOf("/")!==-1)throw new G(L.INVALID_ARGUMENT,`Invalid query. When querying a collection by documentId(), you must provide a plain document ID, but '${n}' contains a '/' character.`);const r=e.path.child(Ee.fromString(n));if(!X.isDocumentKey(r))throw new G(L.INVALID_ARGUMENT,`Invalid query. When querying a collection group by documentId(), the value provided must result in a valid document path, but '${r}' is not because it has an odd number of segments (${r.length}).`);return Xm(t,new X(r))}if(n instanceof at)return Xm(t,n._key);throw new G(L.INVALID_ARGUMENT,`Invalid query. When querying with documentId(), you must provide a valid string or a DocumentReference, but it was: ${$u(n)}.`)}function jg(t,e){if(!Array.isArray(t)||t.length===0)throw new G(L.INVALID_ARGUMENT,`Invalid Query. A non-empty array is required for '${e.toString()}' filters.`)}function Y1(t,e){const n=function(i,s){for(const o of i)for(const l of o.getFlattenedFilters())if(s.indexOf(l.op)>=0)return l.op;return null}(t.filters,function(i){switch(i){case"!=":return["!=","not-in"];case"array-contains-any":case"in":return["not-in"];case"not-in":return["array-contains-any","in","not-in","!="];default:return[]}}(e.op));if(n!==null)throw n===e.op?new G(L.INVALID_ARGUMENT,`Invalid query. You cannot use more than one '${e.op.toString()}' filter.`):new G(L.INVALID_ARGUMENT,`Invalid query. You cannot use '${e.op.toString()}' filters with '${n.toString()}' filters.`)}function KS(t,e,n){let r;return r=t?t.toFirestore(e):e,r}class yl{constructor(e,n){this.hasPendingWrites=e,this.fromCache=n}isEqual(e){return this.hasPendingWrites===e.hasPendingWrites&&this.fromCache===e.fromCache}}class Ss extends Q1{constructor(e,n,r,i,s,o){super(e,n,r,i,o),this._firestore=e,this._firestoreImpl=e,this.metadata=s}exists(){return super.exists()}data(e={}){if(this._document){if(this._converter){const n=new Ol(this._firestore,this._userDataWriter,this._key,this._document,this.metadata,null);return this._converter.fromFirestore(n,e)}return this._userDataWriter.convertValue(this._document.data.value,e.serverTimestamps)}}get(e,n={}){if(this._document){const r=this._document.data.field(rc("DocumentSnapshot.get",e));if(r!==null)return this._userDataWriter.convertValue(r,n.serverTimestamps)}}toJSON(){if(this.metadata.hasPendingWrites)throw new G(L.FAILED_PRECONDITION,"DocumentSnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e=this._document,n={};return n.type=Ss._jsonSchemaVersion,n.bundle="",n.bundleSource="DocumentSnapshot",n.bundleName=this._key.toString(),!e||!e.isValidDocument()||!e.isFoundDocument()?n:(this._userDataWriter.convertObjectMap(e.data.value.mapValue.fields,"previous"),n.bundle=(this._firestore,this.ref.path,"NOT SUPPORTED"),n)}}Ss._jsonSchemaVersion="firestore/documentSnapshot/1.0",Ss._jsonSchema={type:Ge("string",Ss._jsonSchemaVersion),bundleSource:Ge("string","DocumentSnapshot"),bundleName:Ge("string"),bundle:Ge("string")};class Ol extends Ss{data(e={}){return super.data(e)}}class ks{constructor(e,n,r,i){this._firestore=e,this._userDataWriter=n,this._snapshot=i,this.metadata=new yl(i.hasPendingWrites,i.fromCache),this.query=r}get docs(){const e=[];return this.forEach(n=>e.push(n)),e}get size(){return this._snapshot.docs.size}get empty(){return this.size===0}forEach(e,n){this._snapshot.docs.forEach(r=>{e.call(n,new Ol(this._firestore,this._userDataWriter,r.key,r,new yl(this._snapshot.mutatedKeys.has(r.key),this._snapshot.fromCache),this.query.converter))})}docChanges(e={}){const n=!!e.includeMetadataChanges;if(n&&this._snapshot.excludesMetadataChanges)throw new G(L.INVALID_ARGUMENT,"To include metadata changes with your document changes, you must also pass { includeMetadataChanges:true } to onSnapshot().");return this._cachedChanges&&this._cachedChangesIncludeMetadataChanges===n||(this._cachedChanges=function(i,s){if(i._snapshot.oldDocs.isEmpty()){let o=0;return i._snapshot.docChanges.map(l=>{const u=new Ol(i._firestore,i._userDataWriter,l.doc.key,l.doc,new yl(i._snapshot.mutatedKeys.has(l.doc.key),i._snapshot.fromCache),i.query.converter);return l.doc,{type:"added",doc:u,oldIndex:-1,newIndex:o++}})}{let o=i._snapshot.oldDocs;return i._snapshot.docChanges.filter(l=>s||l.type!==3).map(l=>{const u=new Ol(i._firestore,i._userDataWriter,l.doc.key,l.doc,new yl(i._snapshot.mutatedKeys.has(l.doc.key),i._snapshot.fromCache),i.query.converter);let d=-1,p=-1;return l.type!==0&&(d=o.indexOf(l.doc.key),o=o.delete(l.doc.key)),l.type!==1&&(o=o.add(l.doc),p=o.indexOf(l.doc.key)),{type:QS(l.type),doc:u,oldIndex:d,newIndex:p}})}}(this,n),this._cachedChangesIncludeMetadataChanges=n),this._cachedChanges}toJSON(){if(this.metadata.hasPendingWrites)throw new G(L.FAILED_PRECONDITION,"QuerySnapshot.toJSON() attempted to serialize a document with pending writes. Await waitForPendingWrites() before invoking toJSON().");const e={};e.type=ks._jsonSchemaVersion,e.bundleSource="QuerySnapshot",e.bundleName=vf.newId(),this._firestore._databaseId.database,this._firestore._databaseId.projectId;const n=[],r=[],i=[];return this.docs.forEach(s=>{s._document!==null&&(n.push(s._document),r.push(this._userDataWriter.convertObjectMap(s._document.data.value.mapValue.fields,"previous")),i.push(s.ref.path))}),e.bundle=(this._firestore,this.query._query,e.bundleName,"NOT SUPPORTED"),e}}function QS(t){switch(t){case 0:return"added";case 2:case 3:return"modified";case 1:return"removed";default:return ee(61501,{type:t})}}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */ks._jsonSchemaVersion="firestore/querySnapshot/1.0",ks._jsonSchema={type:Ge("string",ks._jsonSchemaVersion),bundleSource:Ge("string","QuerySnapshot"),bundleName:Ge("string"),bundle:Ge("string")};function X1(t){t=hu(t,Zr);const e=hu(t.firestore,Uf),n=U1(e),r=new HS(e);return GS(t._query),AS(n,t._query).then(i=>new ks(e,r,t,i))}function J1(t,e){const n=hu(t.firestore,Uf),r=VS(t),i=KS(t.converter,e),s=q1(t.firestore);return YS(n,[FS(s,"addDoc",r._key,i,t.converter!==null,{}).toMutation(r._key,Yn.exists(!1))]).then(()=>r)}function YS(t,e){const n=U1(t);return CS(n,e)}(function(e,n=!0){bE(uE),du(new ca("firestore",(r,{instanceIdentifier:i,options:s})=>{const o=r.getProvider("app").getImmediate(),l=new Uf(new kE(r.getProvider("auth-internal")),new CE(o,r.getProvider("app-check-internal")),GE(o,i),o);return s={useFetchStreams:n,...s},l._setSettings(s),l},"PUBLIC").setMultipleInstances(!0)),Es(Dg,Mg,e),Es(Dg,Mg,"esm2020")})();const XS={apiKey:"AIzaSyDGUxT4nhAPYsxzmOAESKsFgkd4jhUif4o",authDomain:"dont-touch-purple.firebaseapp.com",projectId:"dont-touch-purple",storageBucket:"dont-touch-purple.firebasestorage.app",messagingSenderId:"46782482111",appId:"1:46782482111:web:a47a1b9afc5feba4eaa80a",measurementId:"G-QVXYQ7C2WN"};let vl=null;function ic(){try{if(vl)return vl;const t=Mm().length?Mm()[0]:yv(XS);return vl=DS(t),vl}catch(t){return console.warn("[DTP-Firebase] Firestore init failed:",t),null}}async function JS(t){const e=ic();e&&await J1(nc(e,"lb_global"),{...t,ts:K1()})}async function ZS(){const t=ic();if(!t)throw new Error("no db");try{const e=Kf(nc(t,"lb_global"),Jf("score","desc"),ep(20));return(await X1(e)).docs.map(r=>{const i=r.data();return{score:i.score??0,initials:i.initials??"???",date:i.date??"",mode:i.mode??"classic"}})}catch(e){throw e}}async function ek(t,e){const n=ic();if(!n)return;const r=nc(n,"dust_wallet");Kf(r,Jf("name"),ep(50)),await J1(r,{name:t,dust:e,ts:K1()})}async function tk(t){const e=ic();if(!e)return 0;try{const n=new Date(Date.now()-6048e5).toLocaleDateString(),r=Kf(nc(e,"lb_global"),Jf("score","desc"),ep(50));return(await X1(r)).docs.map(u=>u.data()).filter(u=>u.date>=n).slice(0,3).some(u=>u.initials===t)?500:0}catch{return 0}}const Tu=2e3,Z1=380,nk=.96,rk=5,tp=5,ik=12,Og="dtp-keys-p1",Fg="dtp-keys-p2",e_="dtp-lb-classic",t_="dtp-lb-evolve",zg="dtp-privacy-ok",bo="dtp-player-name",n_="dtp-dust",r_="dtp-energy-data",i_="dtp-shop",Ug="dtp-weekly-bonus",s_="dtp-stored-pwr",Dn=5,Su=15*60*1e3,To=50,fh=[{id:"default",name:"Default",cost:0,colors:{bg:"#0d0820",purple:"#c026d3",accent:"#f0abfc",text:"#f0eaff"}},{id:"neon",name:"Neon",cost:800,colors:{bg:"#001a1a",purple:"#00ffe0",accent:"#00ffa0",text:"#e0fff8"}},{id:"midnight",name:"Midnight",cost:600,colors:{bg:"#060614",purple:"#818cf8",accent:"#c7d2fe",text:"#e0e7ff"}},{id:"pastel",name:"Pastel",cost:700,colors:{bg:"#fdf0ff",purple:"#c084fc",accent:"#f9a8d4",text:"#3b0764"}},{id:"blood",name:"Blood",cost:900,colors:{bg:"#0f0000",purple:"#ef4444",accent:"#fca5a5",text:"#fff0f0"}},{id:"ocean",name:"Ocean",cost:750,colors:{bg:"#000c1a",purple:"#0ea5e9",accent:"#7dd3fc",text:"#e0f7ff"}}],sk=[{id:"freeze1",name:"Freeze ×1",icon:"❄",cost:120,desc:"Save for use mid-game"},{id:"freeze2",name:"Freeze ×2",icon:"❄❄",cost:220,desc:"Two freeze charges"},{id:"shield1",name:"Shield ×1",icon:"◈",cost:150,desc:"Save for use mid-game"},{id:"shield2",name:"Shield ×2",icon:"◈◈",cost:280,desc:"Two shield charges"}],xa=[{cols:2,rows:2,total:4,name:"Spark",mask:null},{cols:3,rows:3,total:9,name:"Cross",mask:[1,3,4,5,7]},{cols:3,rows:3,total:9,name:"Grid",mask:null},{cols:4,rows:4,total:16,name:"Diamond",mask:[1,2,4,7,8,11,13,14]},{cols:4,rows:3,total:12,name:"Block",mask:null},{cols:4,rows:4,total:16,name:"Ring",mask:[0,1,2,3,4,7,8,11,12,13,14,15]},{cols:3,rows:4,total:12,name:"Spiral",mask:[0,1,2,5,8,9,10,11,7]},{cols:4,rows:4,total:16,name:"Chaos",mask:null},{cols:5,rows:5,total:25,name:"X-Ray",mask:[0,4,6,8,12,16,18,20,24]},{cols:5,rows:5,total:25,name:"APEX",mask:null}],Zt=[{cols:2,rows:2,mask:null,minStage:0},{cols:3,rows:3,mask:[1,3,4,5,7],minStage:1},{cols:3,rows:3,mask:null,minStage:1},{cols:3,rows:3,mask:[0,2,4,6,8],minStage:1},{cols:3,rows:3,mask:[0,1,2,3,5,6,7,8],minStage:1},{cols:3,rows:3,mask:[0,1,2,5,7,8],minStage:1},{cols:3,rows:3,mask:[1,3,5,7],minStage:1},{cols:3,rows:3,mask:[0,2,3,5,6,8],minStage:1},{cols:3,rows:3,mask:[0,1,2,4,6,7,8],minStage:1},{cols:4,rows:4,mask:[1,2,4,7,8,11,13,14],minStage:3},{cols:4,rows:4,mask:null,minStage:3},{cols:4,rows:4,mask:[0,1,2,3,4,7,8,11,12,13,14,15],minStage:3},{cols:4,rows:4,mask:[0,3,5,6,9,10,12,15],minStage:3},{cols:4,rows:4,mask:[0,1,2,4,5,8,9,12,13,14],minStage:3},{cols:4,rows:4,mask:[0,1,4,5,10,11,14,15],minStage:3},{cols:4,rows:4,mask:[1,2,4,6,7,9,11,13,14],minStage:3},{cols:4,rows:3,mask:null,minStage:3},{cols:5,rows:5,mask:[0,4,6,8,12,16,18,20,24],minStage:7},{cols:5,rows:5,mask:null,minStage:7},{cols:5,rows:5,mask:[2,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,22],minStage:7},{cols:5,rows:5,mask:[0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24],minStage:7},{cols:5,rows:5,mask:[0,2,4,6,8,10,12,14,16,18,20,22,24],minStage:7},{cols:5,rows:5,mask:[0,1,4,5,6,7,8,9,10,12,14,15,16,17,18,19,20,23,24],minStage:7},{cols:3,rows:4,mask:[0,1,2,5,8,9,10,11,7],minStage:2},{cols:3,rows:4,mask:[0,2,3,5,6,8,9,11],minStage:2}],ph=[{color:"red",cssColor:"#ef4444",bg:"radial-gradient(circle at 20% 20%, #4a1010 0%, #1a0404 55%)"},{color:"blue",cssColor:"#3b82f6",bg:"radial-gradient(circle at 20% 20%, #0f1a4a 0%, #04071a 55%)"},{color:"green",cssColor:"#22c55e",bg:"radial-gradient(circle at 20% 20%, #0a3018 0%, #041a0a 55%)"},{color:"orange",cssColor:"#f97316",bg:"radial-gradient(circle at 20% 20%, #4a2010 0%, #1a0a04 55%)"},{color:"cyan",cssColor:"#06b6d4",bg:"radial-gradient(circle at 20% 20%, #083040 0%, #020e14 55%)"},{color:"pink",cssColor:"#ec4899",bg:"radial-gradient(circle at 20% 20%, #4a1030 0%, #1a0410 55%)"},{color:"yellow",cssColor:"#eab308",bg:"radial-gradient(circle at 20% 20%, #3a3010 0%, #141004 55%)"}];function ok(t){const e=Math.floor(t/8)%5;return e===0?"square":e===1?"circle":e===2?"square":e===3?"triangle":"mixed"}function ak(t){return function(){t|=0,t=t+1831565813|0;let e=Math.imul(t^t>>>15,1|t);return e=e+Math.imul(e^e>>>7,61|e)^e,((e^e>>>14)>>>0)/4294967296}}function Bg(){return Math.random()*4294967295>>>0}const lk=14,uk=2.2,ck=.05,mh=4;function $g(t,e){const n=lk*Math.pow(1-ck,t),r=Math.max(uk,n),i=Math.floor(t/mh),s=(e^i*2654435769)>>>0,l=ak(s)()>.5?1:-1;return{duration:r,direction:l}}const Xc=[{min:0,max:4,texts:["Bro couldn't avoid ONE color. 💀","The grid had 12 safe colors. You still lost. 🫠","Have you considered... not touching purple?","A goldfish would've scored higher. Scientifically.","Congratulations on finding the worst possible score.","Purple: 1. You: somehow less than 1.","Even accidentally tapping would've been better.","Did you mean to play a different game? 🙃"]},{min:5,max:9,texts:["Single digits. Your fingers need a firmware update.","That was painful to watch. 😬","You tapped purple like it was the goal.","Somewhere, a purple cell is laughing at you.","Basic difficulty called. It wants a refund.","Bold strategy. Terrible execution.","The tutorial is embarrassed on your behalf."]},{min:10,max:19,texts:["Double digits. The minimum bar cleared. Barely.","You made it to double digits. The grid is unimpressed.","10+ — technically not a complete disaster.","Your thumbs are getting warmed up, apparently.","Progress! You avoided purple... some of the time.","Not bad for your first conscious attempt.","The grid acknowledges your existence. Faintly."]},{min:20,max:34,texts:["Now we're cooking. Medium rare. 🔥","The grid is starting to take you seriously.","20+ — you have actual reflexes. Interesting.","You're in the zone. Stay there.","Your thumbs are having a moment.","The purple is slightly nervous. Good.","Something resembling skill detected."]},{min:35,max:49,texts:["Serious reflexes detected. 🔥","35+? Tell your friends. Brag a little.","Your fingers are professionally trained, apparently.","The grid didn't see that coming.","Almost 50. The threshold of greatness.","You tapped so fast the purple forgot its job.","We're getting somewhere. Keep going."]},{min:50,max:74,texts:["FIFTY. You're a natural. 🏆","Half-century! Legendary energy.","50+ means fast hands and questionable hobbies.","The grid can't stop you. It's accepted this.","Your mom would be proud. Probably.","50+ and counting. You're becoming the grid.","Genuine talent spotted. Finally."]},{min:75,max:99,texts:["75+ is elite territory. 👑","Approaching triple digits. A god awakens.","Your fingers are a biological miracle.","The purple filed a formal complaint. About you.","At this point just go pro.","75+ — researchers want to study your hands.","The grid is scared. Keep it scared."]},{min:100,max:149,texts:["TRIPLE DIGITS. Frame this. 🤯","100+. You've transcended the average human.","The game is genuinely afraid of you now.","Are you using one hand?? Impressive.","100+ — this score belongs in a museum.","The grid has filed for emotional damages.","Absolute specimen. This is real now."]},{min:150,max:999,texts:["ARE YOU HUMAN?? 👾","150+ — we need to talk about your reflexes.","Legend. Myth. Tap god. You.","The purple has retired. Because of you.","Scientists want to study your nervous system.","You broke the intended difficulty curve. Congratulations.","This score should not be possible. And yet.","GOAT status confirmed. No debate."]}];function dk(t){const e=Xc.find(n=>t>=n.min&&t<=n.max)??Xc[Xc.length-1];return e.texts[Math.floor(Math.random()*e.texts.length)]}const o_=["1","2","3","4","q","w","e","r","a","s","d","f","z","x","c","v"],a_=["7","8","9","0","u","i","o","p","j","k","l",";","m",",",".","/"];function l_(t){return t?/^[a-z]$/.test(t)?t.toUpperCase():{" ":"SPC",escape:"ESC",backspace:"⌫",enter:"↵",tab:"↹",",":","}[t]??(t.length===1?t:t.slice(0,3).toUpperCase()):"?"}function qg(t,e){try{const n=localStorage.getItem(t);if(n){const r=JSON.parse(n);if(Array.isArray(r)&&r.length===16)return r}}catch{}return[...e]}function Hg(t,e){try{localStorage.setItem(t,JSON.stringify(e))}catch{}}const hk=["ass","fuck","shit","bitch","cunt","dick","cock","pussy","nigger","nigga","faggot","fag","whore","slut","bastard","damn","hell","sex","porn","nude","kill","rape","pedo","nazi"];function ku(t){const e=t.replace(/[^a-zA-Z0-9_ ]/g,"").trim().slice(0,8)||"Player",n=e.toLowerCase();for(const r of hk)if(n.includes(r))return"Player";return/https?:|www\.|\.com|\.net|\.org/i.test(e)?"Player":e}function fk(t){try{const e=localStorage.getItem(t);if(e)return JSON.parse(e)}catch{}return[]}function pk(t,e){try{localStorage.setItem(t,JSON.stringify(e.slice(0,10)))}catch{}}function mk(t,e,n){const r=ku(n),i=fk(t);i.push({score:e,date:new Date().toLocaleDateString(),initials:r}),i.sort((o,l)=>l.score-o.score);const s=i.slice(0,10);return pk(t,s),s}const Wg=["white","blue","red","orange","yellow","green","cyan","lime","teal","pink","rose","magenta"];function gk(t=0,e=!1){const n=e?Math.min(.42,.22+Math.floor(t/20)*.02):.22;return Math.random()<n?"purple":Wg[Math.floor(Math.random()*Wg.length)]}let Jc=null,u_=!1;function yk(){return Jc||(Jc=new(window.AudioContext||window.webkitAudioContext)),Jc}function Jt(t){if(!u_)try{const e=yk(),n=e.createOscillator(),r=e.createGain();n.connect(r),r.connect(e.destination);const i=e.currentTime;t==="ok"?(n.type="sine",n.frequency.setValueAtTime(880,i),n.frequency.exponentialRampToValueAtTime(1320,i+.08),r.gain.setValueAtTime(.15,i),r.gain.exponentialRampToValueAtTime(.001,i+.12),n.start(),n.stop(i+.12)):t==="bad"?(n.type="sawtooth",n.frequency.setValueAtTime(220,i),n.frequency.exponentialRampToValueAtTime(55,i+.25),r.gain.setValueAtTime(.25,i),r.gain.exponentialRampToValueAtTime(.001,i+.28),n.start(),n.stop(i+.28)):t==="powerup"?(n.type="sine",n.frequency.setValueAtTime(660,i),n.frequency.exponentialRampToValueAtTime(1320,i+.15),r.gain.setValueAtTime(.2,i),r.gain.exponentialRampToValueAtTime(.001,i+.2),n.start(),n.stop(i+.2)):t==="levelup"?(n.type="triangle",n.frequency.setValueAtTime(440,i),n.frequency.setValueAtTime(660,i+.1),n.frequency.setValueAtTime(880,i+.2),r.gain.setValueAtTime(.2,i),r.gain.exponentialRampToValueAtTime(.001,i+.35),n.start(),n.stop(i+.35)):(n.type="square",n.frequency.setValueAtTime(330,i),r.gain.setValueAtTime(.03,i),r.gain.exponentialRampToValueAtTime(.001,i+.04),n.start(),n.stop(i+.04))}catch{}}function Wo(t,e=1){return Math.max(Z1,Tu*Math.pow(nk,Math.floor(t/rk))*e)}function vk(t,e){return(Tu/Wo(t,e?1.4:1)).toFixed(1)+"×"}function _k(t){return Math.max(4,(Tu-Wo(t))/(Tu-Z1)*96)}const wk=[{type:"medpack",weight:7},{type:"shield",weight:5},{type:"freeze",weight:4},{type:"multiplier",weight:5}];function xk(t,e,n,r,i,s=0){const o=n??xa[Math.min(t,xa.length-1)],{mask:l}=o,u=o.cols*o.rows,d=l?[...l]:Array.from({length:u},(V,F)=>F),p=d.length,m=Math.min(2+Math.floor(t*.4),p-1),v=Math.min(2+Math.floor(t*.6),Math.min(p-1,5)),I=Math.max(1,m+Math.floor(Math.random()*(v-m+1))),A=[...d];for(let V=0;V<I;V++){const F=V+Math.floor(Math.random()*(A.length-V));[A[V],A[F]]=[A[F],A[V]]}const P=A.slice(0,I);let M=null;if(r?t>=2:!0){const V=wk.map(y=>y.type==="medpack"&&e<tp?{...y,weight:y.weight+10}:y),F=V.reduce((y,_)=>y+_.weight,0),B=r?F:F*.4,w=Math.random()*100;if(w<B){let y=0;for(const _ of V)if(y+=_.weight,w<y){M=_.type;break}}}let x=null;if(r&&t>=3){const V=Math.random();V<.1?x="ice":V<.17&&(x="hold")}return P.map((V,F)=>{if(F===0&&M)return{idx:V,clicked:!1,type:M};if(F===0&&x==="ice")return{idx:V,clicked:!1,type:"ice",iceCount:2+Math.floor(Math.random()*3)};if(F===0&&x==="hold")return{idx:V,clicked:!1,type:"hold",holdRequired:700+Math.random()*500};const B=gk(s,!r);return i&&B==="purple"?{idx:V,clicked:!1,type:i}:{idx:V,clicked:!1,type:B}})}function Ek(t,e,n){var o;const r=Zt.map((l,u)=>({p:l,i:u})).filter(({p:l})=>l.minStage<=t).filter(({p:l})=>n<20?l.cols<=2&&l.rows<=2:n<50?l.cols<=3&&l.rows<=3:n<120?l.cols<=3&&l.rows<=4:n<250?l.cols<=4&&l.rows<=4:!0);if(r.length<=1)return((o=r[0])==null?void 0:o.i)??0;const i=r.filter(({i:l})=>l!==e),s=i[Math.floor(Math.random()*i.length)];return(s==null?void 0:s.i)??r[0].i}function _l(t,e){const{cols:n,rows:r,mask:i}=e,s=n*r,o=Array(25).fill("inactive");if(i){const l=new Set(i);for(let u=0;u<s;u++)l.has(u)||(o[u]="void")}return t.forEach(l=>{l.clicked||(o[l.idx]=l.type)}),o}function gh(){try{const t=localStorage.getItem(s_);if(t)return JSON.parse(t)}catch{}return{freeze:0,shield:0}}function wl(t){try{localStorage.setItem(s_,JSON.stringify(t))}catch{}}function xr(){const t=gh();return{cells:Array(25).fill("inactive"),active:[],score:0,streak:0,alive:!0,anim:{},health:tp,shield:!1,shieldCount:0,freezeEnd:0,multiplierEnd:0,gridStage:0,stageProgress:0,patternIdx:0,storedFreezeCharges:t.freeze,storedShieldCharges:t.shield}}const bk={medpack:"♥",shield:"◈",freeze:"❄",multiplier:"⚡"},Tk={white:"●",blue:"■",red:"▲",orange:"◆",yellow:"★",green:"✚",cyan:"⬟",lime:"⬡",teal:"⬢",pink:"♦",rose:"▼",magenta:"❋",purple:"✕",medpack:"♥",shield:"◈",freeze:"❄",multiplier:"⚡"};function Sk(t){return{white:"#c7d9f5",blue:"#3b82f6",red:"#ef4444",orange:"#f97316",yellow:"#eab308",green:"#22c55e",cyan:"#06b6d4",lime:"#84cc16",teal:"#14b8a6",pink:"#ec4899",rose:"#f43f5e",magenta:"#d946ef",purple:"#a855f7",medpack:"#f59e0b",shield:"#06b6d4",freeze:"#60a5fa",multiplier:"#f97316"}[t]||"#fff"}function kk({type:t,animState:e,keyLabel:n,showKey:r,pressing:i,onTap:s,onHoldStart:o,onHoldEnd:l,colorblind:u,cellShape:d,counterSpinDur:p,iceCount:m,holdRequired:v,holdStart:I,cellIdx:A}){const[P,M]=D.useState([]),[S,x]=D.useState([]),[k,V]=D.useState(0),[F,B]=D.useState(0),w=u?t!=="inactive"?Tk[t]??null:null:bk[t]??null,y=["cell",t,e,i&&t!=="inactive"?"cell--press":null].filter(Boolean).join(" ");D.useEffect(()=>{if(e!=="pop"||t==="inactive")return;V(Math.round(Math.random()*16-8));const J=Sk(t),Re=Array.from({length:5},(bt,Le)=>{const H=Le/5*Math.PI*2+Math.random()*.8,Y=28+Math.random()*22;return{id:Date.now()+Le,dx:`${Math.round(Math.cos(H)*Y)}px`,dy:`${Math.round(Math.sin(H)*Y)}px`,dr:`${Math.round(120+Math.random()*240)}deg`,color:J}});x(Re),setTimeout(()=>x([]),420)},[e]),D.useEffect(()=>{if(t!=="hold"||!I||!v){B(0);return}const J=setInterval(()=>B(Math.min(100,(Date.now()-I)/v*100)),50);return()=>clearInterval(J)},[t,I,v]);const _=J=>{if(t==="inactive")return;J.preventDefault();const Re=J.currentTarget.getBoundingClientRect(),bt=J.clientX-Re.left,Le=J.clientY-Re.top;if(M(H=>[...H,{id:Date.now()+Math.random(),x:bt,y:Le}]),t==="hold"){o();return}s(bt,Le)},b=J=>{t==="hold"&&(J.preventDefault(),l())},T=p?{animation:`cellCounterSpin ${p} linear infinite`}:{},C=d==="triangle",E={};return d==="circle"&&(E.borderRadius="50%"),f.jsxs("button",{className:y,"data-cell-idx":A,onPointerDown:_,onPointerUp:b,onPointerLeave:b,onContextMenu:J=>J.preventDefault(),style:{touchAction:"none",userSelect:"none",WebkitUserSelect:"none",...E,...T,...e==="pop"?{"--tilt":`${k}deg`}:{}},"aria-label":`${t} cell`,children:[C&&f.jsx("span",{className:"cell-tri-shape"}),t==="ice"&&m!=null&&f.jsxs("span",{className:"cell-overlay-ice",children:["❄",m]}),t==="hold"&&f.jsxs("span",{className:"cell-overlay-hold",children:[f.jsx("span",{className:"hold-btn-outer",children:f.jsx("span",{className:`hold-btn-inner${F>0?" hold-btn-pressed":""}`,children:F>0?"⬤":"HOLD"})}),F>0&&f.jsx("span",{className:"hold-progress",style:{width:F+"%"}})]}),w&&t!=="ice"&&t!=="hold"&&f.jsx("span",{className:"sym",children:w}),r&&t!=="inactive"&&f.jsx("span",{className:"kbadge",children:l_(n)}),P.map(J=>f.jsx("span",{className:"ripple",style:{left:J.x,top:J.y},onAnimationEnd:()=>M(Re=>Re.filter(bt=>bt.id!==J.id))},J.id)),S.map(J=>f.jsx("span",{className:"shard",style:{background:J.color,"--dx":J.dx,"--dy":J.dy,"--dr":J.dr,top:"50%",left:"50%",marginTop:"-3px",marginLeft:"-3px"}},J.id))]})}function c_({health:t,anim:e,shieldCount:n}){const r=n??0,i=Math.max(tp,Math.ceil(t));return f.jsx("div",{className:"hearts",children:Array.from({length:i},(s,o)=>{const l=o<t,u=r>0&&l&&o>=i-r;return f.jsx("span",{className:["heart",l?u?"heart--shield":"heart--full":"heart--empty",e&&o===Math.ceil(t)?"heart--loss":""].filter(Boolean).join(" "),children:"♥"},o)})})}function d_({shield:t,freezeEnd:e,multiplierEnd:n,freezeTotal:r,multTotal:i}){const[s,o]=D.useState(Date.now());D.useEffect(()=>{if(!(t||e>Date.now()||n>Date.now()))return;const v=setInterval(()=>o(Date.now()),100);return()=>clearInterval(v)},[t,e,n]);const l=e>s,u=n>s,d=l?Math.max(0,(e-s)/(r??15e3)*100):0,p=u?Math.max(0,(n-s)/(i??24e3)*100):0;return!t&&!l&&!u?null:f.jsxs("div",{className:"pwr-pills",children:[t&&f.jsxs("div",{className:"pwr-chip pwr-chip--shield",children:[f.jsx("span",{className:"pwr-chip-icon",children:"◈"}),f.jsx("span",{className:"pwr-chip-lbl",children:"Shield"})]}),l&&f.jsxs("div",{className:"pwr-chip pwr-chip--freeze",children:[f.jsx("span",{className:"pwr-chip-icon",children:"❄"}),f.jsx("div",{className:"pwr-chip-bar-track",children:f.jsx("div",{className:"pwr-chip-bar pwr-chip-bar--freeze",style:{width:`${d}%`}})})]}),u&&f.jsxs("div",{className:"pwr-chip pwr-chip--mult",children:[f.jsx("span",{className:"pwr-chip-icon",children:"⚡"}),f.jsx("div",{className:"pwr-chip-bar-track",children:f.jsx("div",{className:"pwr-chip-bar pwr-chip-bar--mult",style:{width:`${p}%`}})})]})]})}function Ik({direction:t,visible:e}){if(!e)return null;const n=t===1;return f.jsx("div",{className:"rot-arrows-container","aria-hidden":!0,children:n?f.jsxs("svg",{className:"rot-arrow rot-arrow--cw rot-arrow--active",viewBox:"0 0 160 160",xmlns:"http://www.w3.org/2000/svg",children:[f.jsx("path",{d:"M 80 12 A 68 68 0 1 1 20 108",fill:"none",stroke:"currentColor",strokeWidth:"20",strokeLinecap:"round",strokeOpacity:"0.9"}),f.jsx("path",{d:"M 80 12 A 68 68 0 0 1 136 56",fill:"none",stroke:"currentColor",strokeWidth:"4",strokeLinecap:"round",strokeOpacity:"0.35"}),f.jsx("polygon",{points:"0,-16 14,12 -14,12",fill:"currentColor",transform:"translate(20,108) rotate(235)"})]}):f.jsxs("svg",{className:"rot-arrow rot-arrow--ccw rot-arrow--active",viewBox:"0 0 160 160",xmlns:"http://www.w3.org/2000/svg",children:[f.jsx("path",{d:"M 80 12 A 68 68 0 1 0 140 108",fill:"none",stroke:"currentColor",strokeWidth:"20",strokeLinecap:"round",strokeOpacity:"0.9"}),f.jsx("path",{d:"M 80 12 A 68 68 0 0 0 24 56",fill:"none",stroke:"currentColor",strokeWidth:"4",strokeLinecap:"round",strokeOpacity:"0.35"}),f.jsx("polygon",{points:"0,-16 14,12 -14,12",fill:"currentColor",transform:"translate(140,108) rotate(305)"})]})})}function Ak(t,e,n){const r=Math.max(t,e);return n?"clamp(38px, 9vw, 56px)":r<=2?"clamp(100px, 28vw, 140px)":r<=3?"clamp(80px, 22vw, 110px)":r<=4?"clamp(60px, 16vw, 84px)":"clamp(48px, 13vw, 66px)"}function Gg({ps:t,anim:e,onTap:n,onHoldStart:r,onHoldEnd:i,keyLabels:s,showKeys:o,pressing:l,label:u,heartAnim:d,mode:p,colorblind:m,cbFilter:v,is2P:I,shakeGrid:A,cellShape:P,rareMode:M,onPause:S,isFS:x,spinLevel:k,gameSeed:V}){const F=Date.now(),B=p==="evolve"?Zt[t.patternIdx]??xa[0]:{cols:3,rows:3,mask:null},{cols:w,rows:y,mask:_}=B,b=w*y,T=t.freezeEnd>F,C=_?new Set(_):null,E=p==="evolve"&&k>=3,J=E?$g(k,V):null,Re=J?{animation:`gpanelSpinContinuous${J.direction===1?"CW":"CCW"} ${J.duration.toFixed(2)}s linear infinite`}:{},bt=E&&k%mh===mh-1,Le=E?$g(k+1,V):null,H=bt&&J&&Le&&J.direction!==Le.direction,Y=Le?Le.direction:1,te=k>=20&&J?`${(J.duration*1.4).toFixed(2)}s`:null;return f.jsxs("div",{className:`ppanel${t.alive?"":" ppanel--dead"}`,children:[u&&f.jsx("div",{className:"plabel-row",children:f.jsx("div",{className:"plabel",children:u})}),I&&f.jsxs("div",{className:"phud",children:[f.jsxs("div",{className:"phud-score-row",children:[f.jsx("div",{className:"phud-score",children:t.score}),t.streak>=3&&f.jsxs("div",{className:"combo-wrap combo-wrap--sm",children:["×",t.streak]})]}),f.jsx(c_,{health:t.health,anim:d,shieldCount:t.shieldCount})]}),I&&f.jsx("div",{className:"pwr-zone",children:f.jsx(d_,{shield:t.shield,freezeEnd:t.freezeEnd,multiplierEnd:t.multiplierEnd,freezeTotal:15e3,multTotal:24e3})}),f.jsxs("div",{className:"gpanel-wrap",style:{"--cell":Ak(w,y,I)},children:[H&&f.jsx(Ik,{direction:Y,visible:!0}),f.jsx("div",{className:`gpanel${A?" shake-grid":""}`,style:{gridTemplateColumns:`repeat(${w}, var(--cell))`,gridTemplateRows:`repeat(${y}, var(--cell))`,...T?{outline:"2px solid #60a5fa"}:{},...v?{filter:v}:{},...M.active?{outline:`2px solid ${M.cssColor}`}:{},...Re},children:Array.from({length:b},(we,oe)=>{if(C&&!C.has(oe))return f.jsx("div",{className:"cell-void"},oe);const ut=t.cells[oe]??"inactive",Ke=t.active.find(Ui=>Ui.idx===oe),Tt=P==="mixed"?["square","circle","triangle"][oe%3]:P,Ht=Math.floor(oe/w),ei=oe%w,sr=Ht*4+ei;return f.jsx(kk,{type:ut,animState:e[oe]||null,keyLabel:s[sr]||"",showKey:o,pressing:l.has(oe),onTap:()=>n(oe),onHoldStart:()=>r(oe),onHoldEnd:()=>i(oe),colorblind:m,cellShape:p==="evolve"?Tt:"square",counterSpinDur:te,iceCount:Ke==null?void 0:Ke.iceCount,holdRequired:Ke==null?void 0:Ke.holdRequired,holdStart:Ke==null?void 0:Ke.holdStart,cellIdx:oe},oe)})})]})]})}function Ck({mode:t,onClose:e}){const[n,r]=D.useState([]),[i,s]=D.useState(!0),[o,l]=D.useState(!1),u=D.useCallback(async()=>{s(!0);try{const d=await ZS();r(d),l(!0)}catch(d){console.warn("[DTP-LB] Firebase fetch failed, using local fallback:",d);try{const p=localStorage.getItem(e_),m=localStorage.getItem(t_),v=p?JSON.parse(p).map(P=>({...P,mode:"classic"})):[],I=m?JSON.parse(m).map(P=>({...P,mode:"evolve"})):[],A=[...v,...I].sort((P,M)=>M.score-P.score).slice(0,20);r(A)}catch{r([])}l(!1)}finally{s(!1)}},[]);return D.useEffect(()=>{u()},[u]),f.jsxs("div",{className:"lb-wrap screen-slide",children:[f.jsxs("div",{className:"lb-header",children:[f.jsxs("span",{className:"lb-title",children:["🏆 ",o?"Global":"Local"," Leaderboard"]}),f.jsx("span",{className:"lb-sub",style:{fontSize:10,opacity:.55},children:o?"🌐 Live":"📴 Offline"})]}),i?f.jsx("div",{className:"lb-empty",style:{padding:"32px 0",opacity:.6},children:"Loading..."}):n.length===0?f.jsx("p",{className:"lb-empty",children:"No scores yet. Be the first!"}):f.jsx("div",{className:"lb-list",children:n.map((d,p)=>f.jsxs("div",{className:`lb-row ${p===0?"lb-row--gold":p===1?"lb-row--silver":p===2?"lb-row--bronze":""}`,children:[f.jsx("span",{className:"lb-rank",children:p===0?"🥇":p===1?"🥈":p===2?"🥉":`#${p+1}`}),f.jsx("span",{className:"lb-ini",children:d.initials}),f.jsx("span",{className:"lb-score",children:d.score}),f.jsx("span",{className:"lb-mode-chip",style:{background:d.mode==="evolve"?"rgba(192,38,211,0.18)":"rgba(96,165,250,0.18)",color:d.mode==="evolve"?"#f0abfc":"#93c5fd",fontSize:9,padding:"1px 5px",borderRadius:4,fontWeight:800,fontFamily:"var(--font-ui)"},children:d.mode==="evolve"?"∞ Evolve":"⊞ Classic"}),f.jsx("span",{className:"lb-date",children:d.date})]},p))}),f.jsxs("div",{style:{display:"flex",gap:8,marginTop:12},children:[f.jsx("button",{className:"btn-ghost",style:{flex:1},onClick:e,children:"← Back"}),f.jsx("button",{className:"btn-ghost",style:{flex:1},onClick:u,children:"↻ Refresh"})]})]})}function yh(){try{return parseInt(localStorage.getItem(n_)||"0",10)||0}catch{return 0}}function np(t){try{localStorage.setItem(n_,String(Math.max(0,t)))}catch{}}function Kg(t){const e=yh()+t;return np(e),e}function rp(){try{const t=localStorage.getItem(r_);if(t)return JSON.parse(t)}catch{}return{count:Dn,lastRegen:Date.now()}}function ip(t){try{localStorage.setItem(r_,JSON.stringify(t))}catch{}}function No(){const t=rp();if(t.count>=Dn)return{count:Dn,lastRegen:Date.now()};const e=Date.now()-t.lastRegen,n=Math.floor(e/Su);if(n>0){const r=Math.min(Dn,t.count+n),i=t.lastRegen+n*Su,s={count:r,lastRegen:i};return ip(s),s}return t}function Rk(){const t=No();return t.count<=0?!1:(ip({count:t.count-1,lastRegen:t.lastRegen}),!0)}function vh(){const t=rp();if(t.count>=Dn)return 0;const e=Date.now()-t.lastRegen;return Su-e%Su}function _h(){try{const t=localStorage.getItem(i_);if(t)return JSON.parse(t)}catch{}return{unlockedThemes:["default"],equippedTheme:"default"}}function Qg(t){try{localStorage.setItem(i_,JSON.stringify(t))}catch{}}function Pk({dust:t,onDustChange:e,onClose:n}){const[r,i]=D.useState(()=>_h()),[s,o]=D.useState("themes"),[l,u]=D.useState(null),d=A=>{if(t<A)return!1;const P=t-A;return np(P),e(P),!0},p=(A,P)=>{if(!d(P))return;const M={...r,unlockedThemes:[...r.unlockedThemes,A]};i(M),Qg(M),u(A),setTimeout(()=>u(null),600)},m=A=>{const P={...r,equippedTheme:A};i(P),Qg(P)},v=(A,P)=>{if(!d(P))return;const M=gh();A==="freeze1"&&wl({...M,freeze:M.freeze+1}),A==="freeze2"&&wl({...M,freeze:M.freeze+2}),A==="shield1"&&wl({...M,shield:M.shield+1}),A==="shield2"&&wl({...M,shield:M.shield+2}),u(A),setTimeout(()=>u(null),600)},I=gh();return f.jsxs("div",{className:"lb-wrap screen-slide",children:[f.jsxs("div",{className:"lb-header",children:[f.jsx("span",{className:"lb-title",children:"🛒 Shop"}),f.jsxs("span",{style:{fontSize:13,color:"var(--accent)",fontWeight:800,fontFamily:"var(--font-ui)"},children:["💜 ",t.toLocaleString()]})]}),f.jsxs("div",{className:"shop-tabs",children:[f.jsx("button",{className:`shop-tab${s==="themes"?" shop-tab--on":""}`,onClick:()=>o("themes"),children:"🎨 Themes"}),f.jsx("button",{className:`shop-tab${s==="powerups"?" shop-tab--on":""}`,onClick:()=>o("powerups"),children:"⚡ Power-ups"})]}),s==="themes"&&f.jsxs(f.Fragment,{children:[f.jsx("div",{className:"shop-hint",children:"Cosmetic themes — affects colors & background"}),f.jsx("div",{className:"shop-grid",children:fh.map(A=>{const P=r.unlockedThemes.includes(A.id),M=r.equippedTheme===A.id;return f.jsxs("div",{className:`shop-item${M?" shop-item--equipped":""}${l===A.id?" shop-item--bought":""}`,children:[f.jsx("div",{className:"shop-swatch",style:{background:`linear-gradient(135deg, ${A.colors.bg} 0%, ${A.colors.purple}88 100%)`},children:f.jsx("span",{style:{fontSize:22,filter:"drop-shadow(0 2px 6px rgba(0,0,0,0.5))"},children:"🎨"})}),f.jsx("div",{className:"shop-name",children:A.name}),A.cost===0||P?f.jsx("button",{className:M?"btn-primary btn-sm":"btn-ghost btn-sm",style:{fontSize:11,padding:"4px 12px"},onClick:()=>m(A.id),children:M?"✓ On":"Equip"}):f.jsxs("button",{className:"btn-ghost btn-sm",style:{fontSize:11,padding:"4px 12px",opacity:t>=A.cost?1:.4},onClick:()=>p(A.id,A.cost),disabled:t<A.cost,children:["💜 ",A.cost]})]},A.id)})})]}),s==="powerups"&&f.jsxs(f.Fragment,{children:[f.jsx("div",{className:"shop-hint",children:"Saved charges carry into your next game — tap to activate mid-round"}),I.freeze>0||I.shield>0?f.jsxs("div",{className:"shop-inventory",children:[f.jsx("span",{className:"shop-inv-lbl",children:"In your bag:"}),I.freeze>0&&f.jsxs("span",{className:"shop-inv-chip",children:["❄ ×",I.freeze]}),I.shield>0&&f.jsxs("span",{className:"shop-inv-chip",children:["◈ ×",I.shield]})]}):null,f.jsx("div",{className:"shop-pwr-list",children:sk.map(A=>f.jsxs("div",{className:`shop-pwr-item${l===A.id?" shop-item--bought":""}`,children:[f.jsx("div",{className:"shop-pwr-icon",children:A.icon.split("").map((P,M)=>f.jsx("span",{children:P},M))}),f.jsxs("div",{className:"shop-pwr-info",children:[f.jsx("div",{className:"shop-pwr-name",children:A.name}),f.jsx("div",{className:"shop-pwr-desc",children:A.desc})]}),f.jsxs("button",{className:"btn-ghost btn-sm",style:{fontSize:12,padding:"5px 14px",flexShrink:0,opacity:t>=A.cost?1:.4},onClick:()=>v(A.id,A.cost),disabled:t<A.cost,children:["💜 ",A.cost]})]},A.id))})]}),f.jsx("button",{className:"btn-ghost",style:{width:"100%",marginTop:14},onClick:n,children:"← Back"})]})}function Nk({dust:t}){return f.jsxs("div",{className:"dust-widget",children:[f.jsx("span",{className:"dust-icon",children:"💜"}),f.jsx("span",{className:"dust-val",children:t.toLocaleString()})]})}function Vk({onClose:t}){return f.jsxs("div",{className:"how-wrap screen-slide",children:[f.jsx("h2",{className:"how-title",children:"How to Play"}),f.jsxs("div",{className:"how-grid",children:[f.jsxs("div",{className:"how-row",children:[f.jsx("span",{className:"how-icon",style:{color:"#dde4ee"},children:"⬜"}),f.jsxs("div",{children:[f.jsx("b",{children:"Safe colors"}),f.jsx("br",{}),"Tap as fast as you can for +1 point"]})]}),f.jsxs("div",{className:"how-row",children:[f.jsx("span",{className:"how-icon",style:{color:"#a855f7"},children:"🟣"}),f.jsxs("div",{children:[f.jsx("b",{children:"Purple = danger"}),f.jsx("br",{}),"Never tap purple — you lose a heart"]})]}),f.jsxs("div",{className:"how-row",children:[f.jsx("span",{className:"how-icon",style:{color:"#fcd34d"},children:"♥"}),f.jsxs("div",{children:[f.jsx("b",{children:"Medpack"}),f.jsx("br",{}),"Restores one heart"]})]}),f.jsxs("div",{className:"how-row",children:[f.jsx("span",{className:"how-icon",style:{color:"#67e8f9"},children:"◈"}),f.jsxs("div",{children:[f.jsx("b",{children:"Shield"}),f.jsx("br",{}),"Blocks the next damage"]})]}),f.jsxs("div",{className:"how-row",children:[f.jsx("span",{className:"how-icon",style:{color:"#bfdbfe"},children:"❄"}),f.jsxs("div",{children:[f.jsx("b",{children:"Freeze"}),f.jsx("br",{}),"Slows time by 40% for 5 seconds"]})]}),f.jsxs("div",{className:"how-row",children:[f.jsx("span",{className:"how-icon",style:{color:"#fb923c"},children:"⚡"}),f.jsxs("div",{children:[f.jsx("b",{children:"Multiplier"}),f.jsx("br",{}),"Double points for 8 seconds"]})]})]}),f.jsxs("div",{className:"how-modes",children:[f.jsxs("div",{className:"how-mode",children:[f.jsx("b",{children:"⊞ Classic"})," — Fixed 3×3 grid, pure speed challenge"]}),f.jsxs("div",{className:"how-mode",children:[f.jsx("b",{children:"∞ Evolve Mode"})," — Grid grows from 2×2 to 5×5 as you improve"]})]}),f.jsx("p",{className:"how-tip",children:"⚡ Miss a safe cell = lose a heart · Tap purple = lose a heart · Survive = glory"}),f.jsx("button",{className:"btn-ghost",onClick:t,children:"← Back"})]})}function Dk({initP1:t,initP2:e,numPlayers:n,onSave:r,onCancel:i}){const[s,o]=D.useState(1),[l,u]=D.useState([...t]),[d,p]=D.useState([...e]),[m,v]=D.useState(null),I=D.useRef(null);I.current=m;const A=s===1?l:d,P=s===1?u:p;return D.useEffect(()=>{const M=new Set(["control","alt","meta","shift","tab","capslock","f1","f2","f3","f4","f5","f6","f7","f8","f9","f10","f11","f12"]),S=x=>{if(I.current===null)return;const k=x.key.toLowerCase();if(!M.has(k)){if(x.preventDefault(),k==="escape"){v(null);return}P(V=>{const F=[...V],B=F.indexOf(k);return B!==-1&&B!==I.current&&(F[B]=""),F[I.current]=k,F}),v(null)}};return window.addEventListener("keydown",S),()=>window.removeEventListener("keydown",S)},[P]),f.jsx("div",{className:"kb-overlay",children:f.jsxs("div",{className:"kb-panel",children:[f.jsx("h2",{className:"kb-title",children:"Customize Keys"}),n===2&&f.jsx("div",{className:"kb-tabs",children:[1,2].map(M=>f.jsxs("button",{className:`kb-tab ${s===M?"kb-tab--on":""}`,onClick:()=>{o(M),v(null)},children:["Player ",M]},M))}),f.jsx("p",{className:"kb-hint",children:m!==null?`Press a key for Row ${Math.floor(m/4)+1}, Col ${m%4+1} (Esc = cancel)`:"Tap a cell to select it, then press the key you want"}),f.jsx("div",{className:"kb-grid",children:A.map((M,S)=>f.jsx("button",{className:["kb-cell",m===S?"kb-cell--on":"",M?"":"kb-cell--empty"].filter(Boolean).join(" "),onClick:()=>v(x=>x===S?null:S),children:l_(M)||"—"},S))}),f.jsxs("div",{className:"kb-footer",children:[f.jsx("button",{className:"btn-ghost",onClick:()=>{s===1?u([...o_]):p([...a_]),v(null)},children:"Reset"}),f.jsxs("div",{style:{display:"flex",gap:8},children:[f.jsx("button",{className:"btn-ghost",onClick:i,children:"Cancel"}),f.jsx("button",{className:"btn-primary btn-sm",onClick:()=>r(l,d),children:"Save"})]})]})]})})}function Mk({score:t,mode:e,onClose:n}){const[r,i]=D.useState(!1),s="https://game.mscarabia.com",o=e==="classic"?"Classic":"Evolve",l=`🎮 I scored ${t} in Don't Touch the Purple — ${o} Mode!
Can you beat me? 👇
${s}`,u=encodeURIComponent(l),d=`https://twitter.com/intent/tweet?text=${u}`,p=`https://wa.me/?text=${u}`,m=()=>{var I;const v=()=>{const A=document.createElement("textarea");A.value=l,A.style.position="fixed",A.style.opacity="0",document.body.appendChild(A),A.select(),document.execCommand("copy"),document.body.removeChild(A),i(!0),setTimeout(()=>i(!1),2e3)};(I=navigator.clipboard)!=null&&I.writeText?navigator.clipboard.writeText(l).then(()=>{i(!0),setTimeout(()=>i(!1),2e3)}).catch(v):v()};return f.jsxs("div",{className:"share-card",children:[f.jsxs("div",{className:"share-inner",children:[f.jsxs("div",{className:"share-logo",children:["Don't Touch the ",f.jsx("span",{style:{color:"#c026d3"},children:"Purple"})]}),f.jsx("div",{className:"share-score",children:t}),f.jsxs("div",{className:"share-mode",children:[o," Mode"]}),f.jsx("div",{className:"share-invite",children:"Think you can beat that? 👀"}),f.jsx("div",{className:"share-url",children:s})]}),f.jsxs("div",{className:"share-btns",children:[f.jsxs("a",{className:"share-social share-social--x",href:d,target:"_blank",rel:"noopener",children:[f.jsx("span",{className:"share-social-icon",children:"𝕏"})," Post on X"]}),f.jsxs("a",{className:"share-social share-social--wa",href:p,target:"_blank",rel:"noopener",children:[f.jsx("span",{className:"share-social-icon",children:"📱"})," WhatsApp"]}),f.jsxs("button",{className:"share-social share-social--copy",onClick:m,children:[f.jsx("span",{className:"share-social-icon",children:r?"✓":"📋"})," ",r?"Copied!":"Copy Link"]})]}),f.jsx("button",{className:"btn-ghost",style:{width:"100%",marginTop:8},onClick:n,children:"← Back"})]})}function Ti({options:t,value:e,onChange:n}){const r=t.findIndex(l=>l.value===e),i=D.useRef(null),s=D.useRef(null),o=D.useCallback(()=>{const l=s.current,u=i.current;if(!l||!u)return;const p=l.querySelectorAll(".pill-opt")[r];p&&(u.style.left=p.offsetLeft+"px",u.style.width=p.offsetWidth+"px")},[r]);return D.useEffect(()=>{o();let l,u;l=requestAnimationFrame(()=>{u=requestAnimationFrame(o)});const d=s.current;if(!d||typeof ResizeObserver>"u")return()=>{cancelAnimationFrame(l),cancelAnimationFrame(u)};const p=new ResizeObserver(()=>{o(),requestAnimationFrame(o)});return p.observe(d),d.parentElement&&p.observe(d.parentElement),()=>{p.disconnect(),cancelAnimationFrame(l),cancelAnimationFrame(u)}},[o,r]),f.jsxs("div",{className:"pill-row",ref:s,children:[f.jsx("div",{className:"pill-thumb",ref:i}),t.map((l,u)=>f.jsx("button",{className:`pill-opt${u===r?" pill-opt--on":""}`,onClick:()=>n(l.value),children:l.label},l.value))]})}function Lk({colorblindMode:t,setColorblindMode:e,theme:n,setTheme:r,muted:i,setMuted:s,isFS:o,toggleFS:l,onClose:u}){return f.jsx("div",{className:"drawer-overlay",onClick:u,children:f.jsxs("div",{className:"drawer-panel",onClick:d=>d.stopPropagation(),children:[f.jsxs("div",{className:"drawer-header",children:[f.jsx("span",{className:"drawer-title",children:"⚙ Settings"}),f.jsx("button",{className:"btn-icon",onClick:u,children:"✕"})]}),f.jsxs("div",{className:"opt-section",children:[f.jsx("div",{className:"opt-label",children:"🌙 Appearance"}),f.jsx(Ti,{options:[{value:"dark",label:"🌑 Dark"},{value:"light",label:"☀️ Light"}],value:n,onChange:r})]}),f.jsxs("div",{className:"opt-section",children:[f.jsx("div",{className:"opt-label",children:"🔊 Sound"}),f.jsx(Ti,{options:[{value:"on",label:"🔊 On"},{value:"off",label:"🔇 Off"}],value:i?"off":"on",onChange:d=>s(d==="off")})]}),f.jsxs("div",{className:"opt-section",children:[f.jsx("div",{className:"opt-label",children:"⊞ Display"}),f.jsx(Ti,{options:[{value:"window",label:"⊟ Window"},{value:"full",label:"⊞ Fullscreen"}],value:o?"full":"window",onChange:()=>l()})]}),f.jsxs("div",{className:"opt-section",children:[f.jsx("div",{className:"opt-label",children:"👁 Colorblind Mode"}),f.jsx(Ti,{options:[{value:"none",label:"None"},{value:"deuteranopia",label:"Deuter"},{value:"protanopia",label:"Protan"},{value:"tritanopia",label:"Tritan"},{value:"monochrome",label:"Mono"}],value:t,onChange:e})]})]})})}function jk({onDismiss:t}){return D.useEffect(()=>{const e=setTimeout(t,6e3);return()=>clearTimeout(e)},[t]),f.jsxs("div",{className:"privacy-banner",children:[f.jsxs("span",{className:"privacy-txt",children:["By playing you accept our terms."," ",f.jsx("a",{href:"/privacy.html",className:"privacy-link-inline",children:"Learn more"}),"."]}),f.jsx("button",{className:"privacy-dismiss-btn",onClick:t,"aria-label":"Dismiss",children:"✕"})]})}function Ok(){return f.jsx("svg",{style:{position:"absolute",width:0,height:0,overflow:"hidden"},"aria-hidden":!0,children:f.jsxs("defs",{children:[f.jsx("filter",{id:"deuteranopia",children:f.jsx("feColorMatrix",{type:"matrix",values:`
            0.625 0.375 0     0 0
            0.7   0.3   0     0 0
            0     0.3   0.7   0 0
            0     0     0     1 0`})}),f.jsx("filter",{id:"protanopia",children:f.jsx("feColorMatrix",{type:"matrix",values:`
            0.567 0.433 0     0 0
            0.558 0.442 0     0 0
            0     0.242 0.758 0 0
            0     0     0     1 0`})}),f.jsx("filter",{id:"tritanopia",children:f.jsx("feColorMatrix",{type:"matrix",values:`
            0.95  0.05  0     0 0
            0     0.433 0.567 0 0
            0     0.475 0.525 0 0
            0     0     0     1 0`})})]})})}function Fk(t){return t==="deuteranopia"?"url('#deuteranopia')":t==="protanopia"?"url('#protanopia')":t==="tritanopia"?"url('#tritanopia')":t==="monochrome"?"grayscale(1)":""}function Yg(t){try{t()}catch(e){console.warn("[DTP-005]",e)}}function zk({p1:t,p2:e,tick:n,gameMode:r,numPlayers:i,rareMode:s,cellShape:o,paused:l,screen:u,onClose:d}){const p=(m,v)=>f.jsxs("div",{className:"dev-row",children:[f.jsx("span",{className:"dev-key",children:m}),f.jsx("span",{className:"dev-val",children:String(v)})]},m);return f.jsx("div",{className:"dev-overlay",onClick:d,children:f.jsxs("div",{className:"dev-panel",onClick:m=>m.stopPropagation(),children:[f.jsx("div",{className:"dev-title",children:"🛠 DEV — Press Ctrl+Shift+D to close"}),f.jsx("div",{className:"dev-section",children:"GAME"}),p("screen",u),p("mode",r),p("players",i),p("tick",n),p("paused",l),p("cellShape",o),p("rareMode.active",s.active),s.active&&p("rareMode.color",s.color),s.active&&p("rareMode.turnsLeft",s.turnsLeft),f.jsx("div",{className:"dev-section",children:"PLAYER 1"}),p("score",t.score),p("health",t.health),p("stage",t.gridStage),p("patternIdx",t.patternIdx),p("streak",t.streak),p("shield",t.shield),p("alive",t.alive),p("active cells",t.active.length),t.active.map((m,v)=>p(`  [${v}] idx:${m.idx} type`,`${m.type}${m.iceCount!=null?` ice×${m.iceCount}`:""}${m.holdRequired!=null?" hold":""} clicked:${m.clicked}`)),i===2&&f.jsxs(f.Fragment,{children:[f.jsx("div",{className:"dev-section",children:"PLAYER 2"}),p("score",e.score),p("health",e.health),p("stage",e.gridStage),p("patternIdx",e.patternIdx),p("alive",e.alive)]}),f.jsx("div",{className:"dev-section",children:"FORCE STAGE (click)"}),xa.map((m,v)=>f.jsx("span",{className:"dev-btn",onClick:()=>{window.dispatchEvent(new CustomEvent("dtp-dev-stage",{detail:v}))},children:m.name},v)),f.jsx("div",{className:"dev-section",children:"FORCE PATTERN (click)"}),Zt.slice(0,12).map((m,v)=>f.jsxs("span",{className:"dev-btn",onClick:()=>{window.dispatchEvent(new CustomEvent("dtp-dev-pattern",{detail:v}))},children:["P",v," ",m.cols,"×",m.rows,m.mask?"m":""]},v)),f.jsx("div",{className:"dev-section",children:"RARE MODE"}),ph.map(m=>f.jsx("span",{className:"dev-btn",style:{color:m.cssColor},onClick:()=>{window.dispatchEvent(new CustomEvent("dtp-dev-rare",{detail:m}))},children:m.color},m.color)),f.jsx("span",{className:"dev-btn",onClick:()=>window.dispatchEvent(new CustomEvent("dtp-dev-rare",{detail:null})),children:"clear rare"})]})})}function Uk({progress:t,done:e,showNameEntry:n,onNameSubmit:r}){const[i,s]=D.useState(""),[o,l]=D.useState(""),u=()=>{const d=ku(i.trim()||"Player");if(d==="Player"&&i.trim().length>0){l("That name isn't allowed. Try another!");return}r(d||"Player")};return f.jsxs("div",{className:`loading-screen${e&&!n?" loading-screen--out":""}`,style:{background:"linear-gradient(145deg,#0d0820,#1a0a3e)",fontFamily:"'Fredoka One',system-ui,sans-serif"},children:[f.jsx("div",{className:"loading-orb loading-orb-1"}),f.jsx("div",{className:"loading-orb loading-orb-2"}),f.jsx("div",{className:"loading-orb loading-orb-3"}),f.jsxs("div",{className:"loading-logo",style:{textShadow:"0 0 40px rgba(192,38,211,0.8)"},children:["Don't Touch the ",f.jsx("span",{className:"loading-purple",children:"Purple"})]}),f.jsx("div",{className:"loading-sub",children:"Get your fingers ready..."}),e?n?f.jsxs("div",{className:"loading-name-entry",style:{background:"rgba(255,255,255,0.05)",padding:"24px",borderRadius:"24px",border:"1px solid rgba(192,38,211,0.3)",backdropFilter:"blur(10px)",marginTop:20,width:"min(320px, 90vw)"},children:[f.jsx("div",{className:"loading-name-label",style:{marginBottom:12},children:"What should we call you?"}),f.jsx("input",{className:"go-input",maxLength:8,placeholder:"Your name",value:i,autoFocus:!0,style:{width:"100%",marginBottom:12},onChange:d=>{s(d.target.value.replace(/[^a-zA-Z0-9_ ]/g,"").slice(0,8)),l("")},onKeyDown:d=>d.key==="Enter"&&u()}),f.jsx("button",{className:"btn-primary",style:{width:"100%",padding:"12px"},onClick:u,children:"Let's Go!"}),o&&f.jsx("div",{style:{color:"#f87171",fontSize:12,marginTop:8,fontFamily:"var(--font-ui)"},children:o})]}):f.jsxs("div",{style:{width:"min(280px, 80vw)",marginTop:20},children:[f.jsx("div",{className:"loading-bar-track",children:f.jsx("div",{className:"loading-bar-fill",style:{width:"100%"}})}),f.jsx("div",{className:"loading-pct",style:{marginTop:8},children:"100%"})]}):f.jsxs("div",{style:{width:"min(280px, 80vw)",marginTop:20},children:[f.jsx("div",{className:"loading-bar-track",children:f.jsx("div",{className:"loading-bar-fill",style:{width:`${t}%`}})}),f.jsxs("div",{className:"loading-pct",style:{marginTop:8},children:[Math.round(t),"%"]})]})]})}function Bk(){const[t,e]=D.useState(0),[n,r]=D.useState(!1),[i,s]=D.useState(!1),[o,l]=D.useState(()=>{try{return localStorage.getItem(bo)}catch{return null}}),[u,d]=D.useState(!1),[p,m]=D.useState(()=>yh()),[v,I]=D.useState(()=>No()),A=v.count;D.useEffect(()=>{const z=()=>I(No());window.addEventListener("focus",z);const $=setInterval(z,3e4);return()=>{window.removeEventListener("focus",z),clearInterval($)}},[]);const[P,M]=D.useState(!1),[S,x]=D.useState(!1),[k,V]=D.useState(()=>_h()),F=fh.find(z=>z.id===k.equippedTheme)??fh[0];D.useEffect(()=>{const z=localStorage.getItem(Ug),$=new Date().toLocaleDateString();z!==$&&o&&tk(o).then(O=>{if(O>0){const Z=Kg(O);m(Z)}localStorage.setItem(Ug,$)}).catch(()=>{})},[o]),D.useEffect(()=>{let z=0;const $=setInterval(()=>{z+=8+Math.random()*12,z>=100&&(z=100,clearInterval($),e(100),setTimeout(()=>{r(!0),localStorage.getItem(bo)?setTimeout(()=>s(!0),600):d(!0)},300)),e(z)},80);return()=>clearInterval($)},[]);const B=z=>{try{localStorage.setItem(bo,z)}catch{}l(z),d(!1),setTimeout(()=>s(!0),400)},[w,y]=D.useState(!1);D.useEffect(()=>{const z=$=>{$.ctrlKey&&$.shiftKey&&$.key==="D"&&($.preventDefault(),y(O=>!O))};return window.addEventListener("keydown",z),()=>window.removeEventListener("keydown",z)},[]);const[_,b]=D.useState("menu"),[T,C]=D.useState("classic"),[E,J]=D.useState(1),[Re,bt]=D.useState("touch"),[Le,H]=D.useState(!1),[Y,te]=D.useState(!1),[we,oe]=D.useState(null),[Tn,ut]=D.useState(!1),[Ke,Tt]=D.useState(""),[Ht,ei]=D.useState("classic"),[sr,Ui]=D.useState(""),[sc,Qs]=D.useState(!1),[Bi,$i]=D.useState(null),[Na,Ys]=D.useState("dark"),[Xs,Js]=D.useState(!1),[et,tt]=D.useState(!1),[or,oc]=D.useState("none"),[Va,Zs]=D.useState(!1),[ti,Da]=D.useState(()=>{try{return!localStorage.getItem(zg)}catch{return!1}}),[pe,Sn]=D.useState(xr()),[ar,qi]=D.useState(xr()),[eo,to]=D.useState(!1),[ni,Hi]=D.useState(!1),[no,kn]=D.useState(new Set),[Ma,ri]=D.useState(new Set),[ii,si]=D.useState(0),[ro,Qe]=D.useState(null),[io,oi]=D.useState(0),[Wi,ac]=D.useState(0),[ai,lr]=D.useState(()=>qg(Og,o_)),[li,lc]=D.useState(()=>qg(Fg,a_)),[ur,so]=D.useState("square"),[nt,un]=D.useState({active:!1,color:"",cssColor:"",turnsLeft:0}),[cn,cr]=D.useState(null),[Un,oo]=D.useState(0),[Gi,ui]=D.useState(0),[dr,La]=D.useState(()=>Bg()),[ja,ci]=D.useState(!1),ce=D.useRef(xr()),Te=D.useRef(xr()),Wt=D.useRef(0),Gt=D.useRef("menu"),ze=D.useRef(1),In=D.useRef("touch"),Bn=D.useRef("classic"),Oa=D.useRef(ai),ao=D.useRef(li),Rt=D.useRef(null),di=D.useRef(1),$e=D.useRef({active:!1,color:"",cssColor:"",turnsLeft:0}),hi=D.useRef(0),$n=D.useRef(!1),hr=D.useRef(!0);D.useEffect(()=>{Gt.current=_},[_]),D.useEffect(()=>{ze.current=E},[E]),D.useEffect(()=>{In.current=Re},[Re]),D.useEffect(()=>{Bn.current=T},[T]),D.useEffect(()=>{Oa.current=ai},[ai]),D.useEffect(()=>{ao.current=li},[li]),D.useEffect(()=>{u_=Le},[Le]),D.useEffect(()=>()=>{hr.current=!1},[]);const Kt=D.useCallback(()=>{hr.current&&(Sn({...ce.current}),qi({...Te.current}),si(Wt.current))},[]),lo=D.useRef(null),Ae=D.useCallback(z=>{lo.current&&clearTimeout(lo.current),oe(z),lo.current=setTimeout(()=>oe(null),2200)},[]),je=D.useCallback((z,$,O,Z)=>{z.current.anim={...z.current.anim,[O]:Z},$({...z.current}),setTimeout(()=>{if(!hr.current)return;const W={...z.current.anim};delete W[O],z.current.anim=W,$({...z.current})},Z==="pop"?300:420)},[]),dn=D.useCallback(z=>{z===1?(to(!0),setTimeout(()=>to(!1),420)):(Hi(!0),setTimeout(()=>Hi(!1),420))},[]),hn=D.useCallback(z=>{z===1?(Js(!0),setTimeout(()=>Js(!1),400)):(tt(!0),setTimeout(()=>tt(!1),400))},[]),qn=D.useCallback(z=>{Rt.current&&clearTimeout(Rt.current),$n.current=!1,setTimeout(()=>{if(!hr.current)return;const $=ce.current.score,O=Te.current.score,Z=ze.current===1?$:Math.max($,O),W=Kg(Z);if(m(W),Z>0){const ne=localStorage.getItem(bo)||"Player";ek(ne,W).catch(()=>{})}oi(ne=>Math.max(ne,$)),ac(ne=>Math.max(ne,O)),Qe(z),Tt(dk(ze.current===1?$:Math.max($,O))),Gt.current="gameover",b("gameover")},400)},[]),ye=D.useCallback((z,$)=>{if(Gt.current!=="playing")return;const O=z===1?ce:Te,Z=z===1?Sn:qi;if(!O.current||!O.current.alive){console.warn("[DTP-004]");return}const W=O.current.active.find(Pe=>Pe.idx===$);if(!W||W.clicked)return;const de=Bn.current==="evolve",Oe=O.current.patternIdx,rt=de?Zt[Oe]??Zt[0]:{cols:3,rows:3,mask:null};if(!(rt.mask??Array.from({length:rt.cols*rt.rows},(Pe,St)=>St)).includes($))return;const me=$e.current.active?$e.current.color:"purple";if(W.type==="ice"){const Pe=(W.iceCount??1)-1;if(je(O,Z,$,Pe<=0?"pop":"shake"),Jt(Pe<=0?"ok":"tick"),Pe<=0){W.clicked=!0;const St=Date.now()<O.current.multiplierEnd?2:1;O.current.score+=St,O.current.streak+=1,O.current.stageProgress+=1}else W.iceCount=Pe;O.current.cells=_l(O.current.active,rt),Z({...O.current});return}if(W.type==="hold")return;W.clicked=!0;const yr=de?.5:1;if(W.type===me||W.type==="purple"&&me!=="purple"){if(O.current.shieldCount>0)O.current.shieldCount-=1,O.current.shield=O.current.shieldCount>0,Jt("ok"),je(O,Z,$,"pop");else if(O.current.health=Math.max(0,O.current.health-yr),O.current.shield=!1,O.current.streak=0,Jt("bad"),je(O,Z,$,"shake"),dn(z),hn(z),O.current.health<=0){O.current.alive=!1;const Pe=ze.current===2?z===1?Te.current.alive:ce.current.alive:!1;qn(ze.current===1?null:Pe?z===1?"p2":"p1":"tie")}}else if(W.type==="purple"){if(O.current.shieldCount>0)O.current.shieldCount-=1,O.current.shield=O.current.shieldCount>0,Jt("ok"),je(O,Z,$,"pop");else if(O.current.health=Math.max(0,O.current.health-yr),O.current.shield=!1,O.current.streak=0,Jt("bad"),je(O,Z,$,"shake"),dn(z),hn(z),O.current.health<=0){O.current.alive=!1;const Pe=ze.current===2?z===1?Te.current.alive:ce.current.alive:!1;qn(ze.current===1?null:Pe?z===1?"p2":"p1":"tie")}}else if(["medpack","shield","freeze","multiplier"].includes(W.type))Jt("powerup"),je(O,Z,$,"pop"),W.type==="medpack"&&(O.current.health+=1),W.type==="shield"&&(O.current.shieldCount+=1,O.current.shield=!0),W.type==="freeze"&&(O.current.storedFreezeCharges=(O.current.storedFreezeCharges??0)+1),W.type==="multiplier"&&(O.current.multiplierEnd=Date.now()+24e3),Ae(W.type==="medpack"?"♥ +1 Heart!":W.type==="shield"?`🛡 Shield ×${O.current.shieldCount}!`:W.type==="freeze"?"❄ Freeze saved! Tap to use":"⚡ 2× Points!");else{Jt("ok"),je(O,Z,$,"pop");const Pe=Date.now()<O.current.multiplierEnd?2:1;O.current.score+=Pe,O.current.streak+=1,O.current.stageProgress+=1,de&&O.current.stageProgress>=ik&&O.current.gridStage<xa.length-1&&(O.current.gridStage+=1,O.current.stageProgress=0,di.current=1,Jt("levelup"),ui(St=>St+1),$i(`Stage ${O.current.gridStage}`),setTimeout(()=>$i(null),2200))}O.current.cells=_l(O.current.active,rt),Z({...O.current})},[je,qn,dn,hn,Ae]),fi=D.useCallback((z,$)=>{const O=z===1?ce:Te,Z=z===1?Sn:qi;if(!O.current.alive)return;const W=O.current.active.find(ne=>ne.idx===$&&ne.type==="hold"&&!ne.clicked);W&&(W.holdStart=Date.now(),W._holding=!0,Z({...O.current}))},[]),fr=D.useCallback((z,$)=>{const O=z===1?ce:Te,Z=z===1?Sn:qi;if(!O.current.alive)return;const W=O.current.active.find(rt=>rt.idx===$&&rt.type==="hold"&&!rt.clicked);if(!W||!W.holdStart||!W.holdRequired)return;const de=Bn.current==="evolve"?Zt[O.current.patternIdx]??Zt[0]:{cols:3,rows:3,mask:null};if(Date.now()-W.holdStart>=W.holdRequired){W.clicked=!0,W._holding=!1,je(O,Z,$,"pop"),Jt("powerup");const rt=Date.now()<O.current.multiplierEnd?2:1;O.current.score+=rt*2,O.current.streak+=1,O.current.stageProgress+=1,Ae("💪 Hold! +2")}else W.holdStart=void 0,je(O,Z,$,"shake");O.current.cells=_l(O.current.active,de),Z({...O.current})},[je,Ae]),fn=D.useCallback(()=>{if(!hr.current){console.warn("[DTP-001]");return}if(Gt.current!=="playing"||$n.current)return;const z=Date.now(),$=Bn.current;hi.current+=1;const O=hi.current;if($==="evolve"&&so(ok(O)),$==="evolve")if($e.current.active)$e.current.turnsLeft-=1,$e.current.turnsLeft<=0?($e.current={active:!1,color:"",cssColor:"",turnsLeft:0},un({active:!1,color:"",cssColor:"",turnsLeft:0}),Ae("🟣 Back to Purple!")):un({...$e.current});else{const ne=ce.current.score;if(ne>=50&&ne%50<4&&Math.random()<.35){const de=ph[Math.floor(Math.random()*ph.length)],Oe={active:!0,color:de.color,cssColor:de.cssColor,turnsLeft:5+Math.floor(Math.random()*4)};$e.current=Oe,un(Oe),cr({color:de.color,cssColor:de.cssColor}),setTimeout(()=>cr(null),5e3),Ae(`⚠️ Don't Touch ${de.color.toUpperCase()}!`)}}[ce,Te].forEach((ne,de)=>{if(!ne.current.alive||de===1&&ze.current===1)return;const Oe=ne.current.gridStage,rt=ne.current.patternIdx,Qt=$==="evolve"?Zt[rt]??Zt[0]:{cols:3,rows:3,mask:null};if(!Qt||Qt.cols===0){console.error("[DTP-002]");return}const me=new Set(Qt.mask??Array.from({length:Qt.cols*Qt.rows},(Yt,Xt)=>Xt)),yr=$e.current.active?$e.current.color:"purple";if(ne.current.active.forEach(Yt=>{if(!me.has(Yt.idx)||Yt.clicked)return;const Xt=["medpack","shield","freeze","multiplier","ice","hold"].includes(Yt.type),$a=Yt._holding===!0;if(Yt.type!==yr&&Yt.type!=="purple"&&!Xt&&!$a){const dc=$==="evolve"?.5:1;if(ne.current.shieldCount>0)ne.current.shieldCount-=1,ne.current.shield=ne.current.shieldCount>0;else if(ne.current.health=Math.max(0,ne.current.health-dc),ne.current.shield=!1,dn(de+1),hn(de+1),ne.current.health<=0){ne.current.alive=!1;const pi=ze.current===2?de===0?Te.current.alive:ce.current.alive:!1;qn(ze.current===1?null:pi?de===0?"p2":"p1":"tie")}ne.current.streak=0}}),!ne.current.alive)return;const Pe=$==="evolve"?Ek(Oe,rt,ne.current.score):0;ne.current.patternIdx=Pe;const St=$==="evolve"?Zt[Pe]??Zt[0]:{cols:3,rows:3,mask:null},Yi=$e.current.active?$e.current.color:void 0,Xi=xk(Oe,ne.current.health,St,$==="evolve",Yi,Wt.current);ne.current.active=Xi,ne.current.cells=_l(Xi,St),Xi.length===0&&console.warn("[DTP-010]")}),Wt.current+=1,oo(O),Wt.current>60&&Wt.current%20===0&&(ce.current.alive&&(ce.current.score+=2),ze.current===2&&Te.current.alive&&(Te.current.score+=2),Ae("🔥 Survival +2!")),Kt(),Jt("tick");const Z=ce.current.freezeEnd>z||ze.current===2&&Te.current.freezeEnd>z,W=Wo(Wt.current,Z?1.4:1)*di.current;Rt.current=setTimeout(fn,W)},[Kt,qn,dn,hn,Ae]),pr=D.useCallback(()=>{Gt.current==="playing"&&(Rt.current&&clearTimeout(Rt.current),$n.current=!0,ci(!0))},[]),uo=D.useCallback(()=>{$n.current=!1,ci(!1);const z=Date.now(),$=ce.current.freezeEnd>z||ze.current===2&&Te.current.freezeEnd>z,O=Wo(Wt.current,$?1.4:1)*di.current;Rt.current=setTimeout(fn,O)},[fn]),Fa=D.useCallback(()=>{if(No().count<=0){Ae("⚡ No energy! Wait or spend 💜 dust to refill.");return}if(!Rk()){Ae("⚡ No energy!");return}I(No()),Rt.current&&clearTimeout(Rt.current),ce.current=xr(),Te.current=xr(),Wt.current=0,hi.current=0,di.current=1,$e.current={active:!1,color:"",cssColor:"",turnsLeft:0},$n.current=!1,un({active:!1,color:"",cssColor:"",turnsLeft:0}),so("square"),oo(0),ui(0),La(Bg()),Qe(null),Ui(o||""),Qs(!1),ci(!1),cr(null),$i(null),Kt(),Gt.current="playing",b("playing"),Rt.current=setTimeout(fn,Wo(0))},[fn,Kt,Ae,o]),za=D.useCallback(()=>{Rt.current&&clearTimeout(Rt.current),$n.current=!1,ce.current=xr(),Te.current=xr(),Wt.current=0,$e.current={active:!1,color:"",cssColor:"",turnsLeft:0},un({active:!1,color:"",cssColor:"",turnsLeft:0}),cr(null),ui(0),ci(!1),Kt(),Qe(null),Gt.current="menu",b("menu")},[Kt]);D.useEffect(()=>{const z=$=>{if($.repeat||Gt.current!=="playing"||In.current!=="keyboard")return;if($.key==="Escape"){pr();return}const O=$.key.toLowerCase(),Z=de=>{const Oe=de===1?Oa.current:ao.current,Qt=(de===1?ce:Te).current.patternIdx,me=Bn.current==="classic"?{cols:3,rows:3,mask:null}:Zt[Qt]??{cols:3,rows:3,mask:null},yr=me.mask??Array.from({length:me.cols*me.rows},(Pe,St)=>St);for(const Pe of yr){const St=Math.floor(Pe/me.cols),Yi=Pe%me.cols;if(Oe[St*4+Yi]===O)return Pe}return-1},W=Z(1),ne=ze.current===2?Z(2):-1;W!==-1?($.preventDefault(),kn(de=>new Set([...de,W])),setTimeout(()=>kn(de=>{const Oe=new Set(de);return Oe.delete(W),Oe}),150),ye(1,W)):ne!==-1&&($.preventDefault(),ri(de=>new Set([...de,ne])),setTimeout(()=>ri(de=>{const Oe=new Set(de);return Oe.delete(ne),Oe}),150),ye(2,ne))};return window.addEventListener("keydown",z),()=>window.removeEventListener("keydown",z)},[ye,pr]),D.useEffect(()=>{const z=Z=>{const W=Z.detail;ce.current.gridStage=W,ce.current.stageProgress=0,Te.current.gridStage=W,Te.current.stageProgress=0,Kt()},$=Z=>{const W=Z.detail;ce.current.patternIdx=W,Te.current.patternIdx=W,Kt()},O=Z=>{const W=Z.detail;if(!W)$e.current={active:!1,color:"",cssColor:"",turnsLeft:0},un({active:!1,color:"",cssColor:"",turnsLeft:0});else{const ne={active:!0,color:W.color,cssColor:W.cssColor,turnsLeft:10};$e.current=ne,un(ne),cr({color:W.color,cssColor:W.cssColor}),setTimeout(()=>cr(null),5e3)}};return window.addEventListener("dtp-dev-stage",z),window.addEventListener("dtp-dev-pattern",$),window.addEventListener("dtp-dev-rare",O),()=>{window.removeEventListener("dtp-dev-stage",z),window.removeEventListener("dtp-dev-pattern",$),window.removeEventListener("dtp-dev-rare",O)}},[Kt]);const Ua=D.useCallback(async()=>{const z=o||sr.trim()||"Player",$=ku(z),O=T==="classic"?e_:t_,Z=ze.current===1?ce.current.score:Math.max(ce.current.score,Te.current.score),W={score:Z,initials:$,date:new Date().toLocaleDateString(),mode:T};mk(O,Z,$),Qs(!0);try{await JS(W)}catch{}},[o,sr,T]),co=D.useCallback(()=>{var $,O,Z;if(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)||window.innerWidth<=768){te(W=>!W);return}document.fullscreenElement?((Z=document.exitFullscreen)==null||Z.call(document),te(!1)):(O=($=document.documentElement).requestFullscreen)==null||O.call($).then(()=>te(!0)).catch(()=>{console.warn("[DTP-008]"),te(W=>!W)})},[]),mr=D.useCallback(()=>{const z=yh();if(z<To)return;const $=z-To;np($),m($);const O=rp(),Z={count:Math.min(Dn,O.count+1),lastRegen:O.count>=Dn-1?Date.now():O.lastRegen};ip(Z),I(Z),Ae("⚡ Energy refilled!")},[Ae]),An=Fk(or),ho=or!=="none",Pt=E===2,Ki=Re==="keyboard",Ba=pe.freezeEnd>Date.now()||ar.freezeEnd>Date.now(),Qi=_==="playing"||_==="gameover",gr=Pt?"clamp(42px, 10.5vw, 60px)":"clamp(52px, min(16vw,16vh), 80px)",uc=nt.active?{background:`radial-gradient(circle, ${nt.cssColor}bb, ${nt.cssColor}22)`}:{},cc={"--theme-purple":F.colors.purple,"--theme-accent":F.colors.accent};return f.jsxs(f.Fragment,{children:[f.jsx("style",{children:qk}),!i&&f.jsx(Uk,{progress:t,done:n,showNameEntry:u,onNameSubmit:B}),i&&f.jsxs("div",{className:`root${Pt?" root--2p":""}${Na==="light"?" light-theme":""}`,style:{"--cell-1p":gr,...cc},children:[f.jsx("div",{className:"bg-pulse",style:nt.active?{background:`radial-gradient(ellipse at 50% 30%, ${nt.cssColor}44 0%, transparent 65%)`,opacity:1}:{}}),f.jsx("div",{className:"orb orb-1",style:nt.active?uc:{}}),f.jsx("div",{className:"orb orb-2"}),f.jsx("div",{className:"orb orb-3"}),f.jsx(Ok,{}),we&&f.jsx("div",{className:"toast",children:we}),ti&&f.jsx(jk,{onDismiss:()=>{Yg(()=>localStorage.setItem(zg,"1")),Da(!1)}}),cn&&f.jsx("div",{className:"rare-splash",children:f.jsxs("span",{className:"rare-splash-text",style:{color:cn.cssColor,textShadow:`0 0 60px ${cn.cssColor}, 0 0 120px ${cn.cssColor}66`},children:["DON'T",f.jsx("br",{}),"TOUCH",f.jsx("br",{}),cn.color.toUpperCase(),"!"]})}),Va&&f.jsx(Lk,{colorblindMode:or,setColorblindMode:oc,theme:Na,setTheme:Ys,muted:Le,setMuted:H,isFS:Y,toggleFS:co,onClose:()=>Zs(!1)}),w&&f.jsx(zk,{p1:pe,p2:ar,tick:ii,gameMode:T,numPlayers:E,rareMode:nt,cellShape:ur,paused:ja,screen:_,onClose:()=>y(!1)}),ja&&f.jsx("div",{className:"pause-overlay",children:f.jsxs("div",{className:"pause-card",children:[f.jsx("div",{className:"pause-title",children:"⏸ PAUSED"}),f.jsxs("div",{className:"pause-score",children:["Score: ",f.jsxs("strong",{children:[pe.score,Pt?` · ${ar.score}`:""]})]}),f.jsx("button",{className:"btn-play",onClick:uo,children:"▶ RESUME"}),f.jsxs("div",{className:"pause-settings-row",children:[f.jsxs("button",{className:"pause-setting-btn",onClick:()=>H(z=>!z),title:"Sound",children:[Le?"🔇":"🔊",f.jsx("span",{children:Le?"Muted":"Sound On"})]}),f.jsxs("button",{className:"pause-setting-btn",onClick:co,title:"Fullscreen",children:[Y?"⊡":"⊞",f.jsx("span",{children:Y?"Exit FS":"Fullscreen"})]}),f.jsxs("button",{className:"pause-setting-btn",onClick:()=>{uo(),setTimeout(()=>Zs(!0),100)},title:"Settings",children:["⚙",f.jsx("span",{children:"Settings"})]})]}),f.jsx("button",{className:"btn-ghost",style:{width:"100%",textAlign:"center"},onClick:za,children:"🏠 Exit to Menu"}),f.jsx("div",{style:{fontSize:11,color:"var(--muted)",textAlign:"center",fontFamily:"var(--font-ui)"},children:"Exiting will end your current game"})]})}),f.jsxs("header",{className:`hdr${Y?" hdr--hidden":""}`,children:[f.jsxs("span",{className:"logo",children:["Don't Touch the"," ",f.jsx("span",{className:"txt-p",style:nt.active?{color:nt.cssColor,textShadow:`0 0 20px ${nt.cssColor}99`,transition:"color 0.5s, text-shadow 0.5s"}:{},children:nt.active?nt.color.charAt(0).toUpperCase()+nt.color.slice(1):"Purple"})]}),f.jsxs("div",{className:"hdr-right",style:{display:"flex",alignItems:"center",gap:8},children:[f.jsx(Nk,{dust:p}),Qi&&_==="playing"?f.jsx("button",{className:"btn-icon btn-icon--pause",onClick:pr,title:"Pause",children:"⏸"}):f.jsx("button",{className:"btn-icon",onClick:()=>Zs(z=>!z),title:"Settings",children:"⚙"})]})]}),Y&&f.jsx("div",{className:"fs-pulldown",onClick:co,title:"Exit fullscreen",children:f.jsx("span",{className:"fs-pulldown-chevron",children:"⌄"})}),Y&&Qi&&f.jsx("div",{className:"fs-controls",children:_==="playing"&&f.jsx("button",{className:"btn-icon btn-icon--pause",onClick:pr,children:"⏸"})}),_==="leaderboard"&&f.jsx(Ck,{mode:Ht,onClose:()=>b("menu")}),_==="howto"&&f.jsx(Vk,{onClose:()=>b("menu")}),_==="keybind"&&f.jsx(Dk,{initP1:ai,initP2:li,numPlayers:E,onSave:(z,$)=>{Yg(()=>{Hg(Og,z),Hg(Fg,$)}),lr(z),lc($),b("menu")},onCancel:()=>b("menu")}),_==="shop"&&f.jsx(Pk,{dust:p,onDustChange:z=>{m(z),V(_h())},onClose:()=>b("menu")}),_==="menu"&&f.jsxs("div",{className:"menu-card screen-slide",children:[f.jsxs("div",{className:"menu-top-row",children:[f.jsxs("button",{className:"player-pill",onClick:()=>x(!0),children:[f.jsx("span",{className:"player-pill-icon",children:"👤"}),f.jsx("span",{className:"player-pill-name",children:o||"Guest"}),f.jsx("span",{className:"player-pill-edit",children:"✎"})]}),f.jsxs("div",{className:"energy-inline",children:[Array.from({length:Dn},(z,$)=>f.jsx("span",{className:`energy-pip${$<A?" energy-pip--full":""}`,children:"⚡"},$)),A<Dn&&f.jsx("span",{className:"energy-inline-timer",children:(()=>{const z=vh();return`${Math.floor(z/6e4)}:${String(Math.floor(z%6e4/1e3)).padStart(2,"0")}`})()}),A<Dn&&p>=To&&f.jsx("button",{className:"energy-refill-btn",onClick:mr,title:"Refill 1 energy",children:"💜"})]})]}),S&&(()=>{const z=()=>{const[$,O]=D.useState(o||""),Z=()=>{const W=ku($.trim())||"Player";try{localStorage.setItem(bo,W)}catch{}l(W),x(!1)};return f.jsx("div",{className:"overlay",onClick:()=>x(!1),children:f.jsxs("div",{className:"glass-panel",onClick:W=>W.stopPropagation(),children:[f.jsx("h2",{style:{fontFamily:"var(--font-game)",fontSize:20,marginBottom:4,color:"var(--text)"},children:"Switch Player"}),f.jsx("p",{style:{fontSize:12,color:"var(--muted)",fontFamily:"var(--font-ui)",marginBottom:16},children:"Enter a name for this device's player"}),f.jsx("input",{className:"go-input",maxLength:8,placeholder:"Name (8 chars)",autoFocus:!0,value:$,style:{width:"100%",marginBottom:14},onChange:W=>O(W.target.value.replace(/[^a-zA-Z0-9_ ]/g,"").slice(0,8)),onKeyDown:W=>W.key==="Enter"&&Z()}),f.jsxs("div",{style:{display:"flex",gap:8},children:[f.jsx("button",{className:"btn-ghost",style:{flex:1},onClick:()=>x(!1),children:"Cancel"}),f.jsx("button",{className:"btn-primary",style:{flex:1,padding:"10px"},onClick:Z,children:"Save"})]})]})})};return f.jsx(z,{})})(),f.jsxs("div",{className:"menu-header",children:[f.jsxs("h1",{className:"menu-title",children:["Don't Touch the ",f.jsx("span",{className:"txt-p",children:"Purple"})]}),f.jsx("p",{className:"menu-sub",children:"⚡ Tap fast. Avoid purple. Survive."})]}),f.jsxs("div",{className:"opt-grid",children:[f.jsxs("div",{className:"opt-section",children:[f.jsx("div",{className:"opt-label",children:"🎮 Game Mode"}),f.jsx(Ti,{options:[{value:"classic",label:"⊞ Classic"},{value:"evolve",label:"∞ Evolve"}],value:T,onChange:C})]}),f.jsxs("div",{className:"opt-section",children:[f.jsx("div",{className:"opt-label",children:"👥 Players"}),f.jsx(Ti,{options:[{value:1,label:"Solo"},{value:2,label:"Duo"}],value:E,onChange:J})]}),f.jsxs("div",{className:"opt-section",children:[f.jsx("div",{className:"opt-label",children:"🕹 Input"}),f.jsx(Ti,{options:[{value:"touch",label:"👆 Touch"},{value:"keyboard",label:"⌨ Keys"}],value:Re,onChange:bt})]})]}),A>0?f.jsx("button",{className:"btn-play",onClick:Fa,children:"▶ PLAY!"}):f.jsxs("div",{className:"no-energy-block",children:[f.jsx("div",{className:"no-energy-txt",children:"⚡ No energy"}),f.jsx($k,{nextRegenMs:vh()}),p>=To&&f.jsxs("button",{className:"btn-ghost",style:{marginTop:8,fontSize:13},onClick:mr,children:["💜 Spend ",To," dust to refill"]})]}),f.jsxs("div",{className:"menu-links",children:[f.jsx("button",{className:"btn-link",onClick:()=>b("howto"),children:"❓ How to Play"}),f.jsx("button",{className:"btn-link",onClick:()=>{ei(T),b("leaderboard")},children:"🏆 Leaderboard"}),f.jsx("button",{className:"btn-link",onClick:()=>b("shop"),children:"🛒 Shop"}),Ki&&f.jsx("button",{className:"btn-link",onClick:()=>b("keybind"),children:"⌨ Keys"})]})]}),Qi&&f.jsxs(f.Fragment,{children:[!Pt&&f.jsxs("div",{className:"hud",children:[f.jsxs("div",{className:"hud-card hud-card--score",children:[f.jsx("div",{className:"hud-lbl",children:"Score"}),f.jsxs("div",{className:"hud-score-row",children:[f.jsx("div",{className:"hud-val",children:pe.score}),pe.streak>=3&&f.jsxs("div",{className:"combo-wrap",children:["×",pe.streak]})]})]}),f.jsxs("div",{className:"hud-card",children:[f.jsx("div",{className:"hud-lbl",children:"Best"}),f.jsx("div",{className:"hud-val",children:io})]}),f.jsxs("div",{className:"hud-card",children:[f.jsx("div",{className:"hud-lbl",children:"Speed"}),f.jsx("div",{className:"hud-val hud-val--sm",children:vk(ii,Ba)})]}),f.jsx("div",{className:"hud-card hud-card--hearts",children:f.jsx(c_,{health:pe.health,anim:eo,shieldCount:pe.shieldCount})})]}),f.jsx("div",{className:"spd-wrap",children:f.jsx("div",{className:"spd-track",children:f.jsx("div",{className:"spd-fill",style:{width:_k(ii)+"%"}})})}),!Pt&&f.jsxs(f.Fragment,{children:[f.jsxs("div",{className:"pwr-zone pwr-zone--1p",children:[f.jsx(d_,{shield:pe.shield,freezeEnd:pe.freezeEnd,multiplierEnd:pe.multiplierEnd,freezeTotal:15e3,multTotal:24e3}),Bi&&f.jsxs("div",{className:"levelup-badge",children:["🔥 ",Bi]})]}),(pe.storedFreezeCharges>0||pe.storedShieldCharges>0)&&_==="playing"&&f.jsxs("div",{className:"stored-pwr-row",children:[pe.storedFreezeCharges>0&&f.jsxs("button",{className:"stored-pwr-btn stored-pwr-btn--freeze",onClick:()=>{ce.current.freezeEnd=Date.now()+15e3,ce.current.storedFreezeCharges=Math.max(0,(ce.current.storedFreezeCharges??1)-1),Sn({...ce.current}),Ae("❄ Freeze activated!"),Jt("powerup")},children:["❄ ×",pe.storedFreezeCharges]}),pe.storedShieldCharges>0&&f.jsxs("button",{className:"stored-pwr-btn stored-pwr-btn--shield",onClick:()=>{ce.current.shieldCount+=ce.current.storedShieldCharges??0,ce.current.shield=!0,ce.current.storedShieldCharges=0,Sn({...ce.current}),Ae(`🛡 Shield ×${ce.current.shieldCount} activated!`),Jt("powerup")},children:["◈ ×",pe.storedShieldCharges]})]})]}),f.jsxs("div",{className:"game-area",children:[_==="gameover"&&f.jsx("div",{className:"go-overlay",children:Tn?f.jsx(Mk,{score:pe.score,mode:T,onClose:()=>ut(!1)}):f.jsxs(f.Fragment,{children:[f.jsx("div",{className:"go-eyebrow",children:Pt?"ROUND OVER":"GAME OVER"}),Pt?f.jsxs(f.Fragment,{children:[f.jsx("div",{className:"go-winner",children:ro==="p1"?"🏆 P1 Wins!":ro==="p2"?"🏆 P2 Wins!":"🤝 Tie!"}),f.jsxs("div",{className:"go-pair",children:[f.jsxs("div",{className:"go-col",children:[f.jsx("div",{className:"go-plbl",style:{color:"#60a5fa"},children:"P1"}),f.jsx("div",{className:"go-score",children:pe.score})]}),f.jsx("div",{className:"go-sep"}),f.jsxs("div",{className:"go-col",children:[f.jsx("div",{className:"go-plbl",style:{color:"#f472b6"},children:"P2"}),f.jsx("div",{className:"go-score",children:ar.score})]})]})]}):f.jsxs(f.Fragment,{children:[f.jsx("div",{className:"go-num",children:pe.score}),f.jsxs("div",{className:"go-best",children:["Best: ",io]}),f.jsxs("div",{className:"go-msg",children:['"',Ke,'"']}),pe.score>0&&f.jsxs("div",{className:"go-dust-earned",children:["+",pe.score," 💜 dust earned!"]}),sc?f.jsx("div",{className:"go-lb-saved",children:"✓ Saved!"}):f.jsxs("div",{className:"go-lb-form",children:[f.jsx("input",{className:"go-input",maxLength:8,placeholder:"Your name",value:sr,onChange:z=>Ui(z.target.value.replace(/[^a-zA-Z0-9_ ]/g,"").slice(0,8)),onKeyDown:z=>z.key==="Enter"&&Ua()}),f.jsx("button",{className:"btn-primary btn-sm",onClick:Ua,children:"Save"})]})]}),f.jsxs("div",{className:"go-btns",children:[f.jsx("button",{className:"btn-primary",onClick:Fa,children:"▶ Again"}),f.jsx("button",{className:"btn-ghost",onClick:()=>ut(!0),children:"📤 Share"}),f.jsx("button",{className:"btn-ghost",onClick:za,children:"🏠 Menu"})]}),f.jsx("a",{className:"go-bug-btn",href:`mailto:info@mscarabia.com?subject=${encodeURIComponent(`DTP Bug Report (Seed: ${dr})`)}&body=${encodeURIComponent(`GAME STATE
-----------
Score: ${pe.score}
Mode: ${T}
Seed: ${dr}
Tick: ${ii}
Grid Stage: ${pe.gridStage}
Pattern Idx: ${pe.patternIdx}
Health: ${pe.health}
Spin Level: ${Gi}
Streak: ${pe.streak}
Alive: ${pe.alive}

DEVICE
------
UA: ${navigator.userAgent}
URL: ${window.location.href}
Screen: ${window.innerWidth}×${window.innerHeight}

BUG DESCRIPTION
---------------
(describe what happened)
`)}`,target:"_blank",rel:"noopener",children:"🐛 Report a Bug"})]})}),f.jsx(Gg,{ps:pe,anim:pe.anim,onTap:z=>ye(1,z),onHoldStart:z=>fi(1,z),onHoldEnd:z=>fr(1,z),keyLabels:ai,showKeys:Ki,pressing:no,label:Pt?"P1":null,heartAnim:eo,mode:T,colorblind:ho,cbFilter:An,is2P:Pt,shakeGrid:Xs,cellShape:ur,rareMode:nt,onPause:pr,isFS:Y,spinLevel:Gi,gameSeed:dr}),Pt&&f.jsx(Gg,{ps:ar,anim:ar.anim,onTap:z=>ye(2,z),onHoldStart:z=>fi(2,z),onHoldEnd:z=>fr(2,z),keyLabels:li,showKeys:Ki,pressing:Ma,label:"P2",heartAnim:ni,mode:T,colorblind:ho,cbFilter:An,is2P:Pt,shakeGrid:et,cellShape:ur,rareMode:nt,onPause:pr,isFS:Y,spinLevel:Gi,gameSeed:dr})]})]}),_==="menu"&&f.jsxs("footer",{className:"credit",children:[f.jsxs("span",{children:["By Mohammed Ahmed Siddiqui · ",f.jsx("a",{href:"https://mscarabia.com",target:"_blank",rel:"noopener noreferrer",className:"credit-link",children:"mscarabia.com"})]}),f.jsx("a",{href:"/privacy.html",target:"_blank",rel:"noopener noreferrer",className:"credit-link",style:{marginLeft:6},children:"Privacy"})]})]})]})}function $k({nextRegenMs:t}){const[e,n]=D.useState(t);D.useEffect(()=>{const s=setInterval(()=>n(vh()),1e3);return()=>clearInterval(s)},[]);const r=Math.floor(e/6e4),i=Math.floor(e%6e4/1e3);return f.jsxs("div",{className:"no-energy-timer",children:["Next energy in ",r,":",String(i).padStart(2,"0")]})}const qk=`
@import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #0d0820;
  --bg2: rgba(255,255,255,0.06);
  --bg3: rgba(255,255,255,0.11);
  --glass: rgba(255,255,255,0.05);
  --glass-border: rgba(255,255,255,0.12);
  --text: #f0eaff;
  --muted: rgba(240,234,255,0.45);
  --purple: #c026d3;
  --purple-dark: #7e22ce;
  --accent: #f0abfc;
  --cell-1p: min(clamp(52px, 14vw, 88px), clamp(52px, 12vh, 88px));
  --cell-2p: min(clamp(38px, 9vw, 62px), clamp(38px, 9vh, 62px));
  --cell: var(--cell-1p);
  --gap: 8px;
  --r: 14px;
  --panel-blur: 18px;
  --font-game: 'Fredoka One', 'Nunito', system-ui, sans-serif;
  --font-ui: 'Nunito', system-ui, sans-serif;
}

.light-theme {
  --bg: #f5f0ff;
  --bg2: rgba(100,60,180,0.08);
  --bg3: rgba(100,60,180,0.14);
  --glass: rgba(255,255,255,0.7);
  --glass-border: rgba(140,90,210,0.22);
  --text: #1a0a2e;
  --muted: rgba(60,20,100,0.55);
  --purple: #7c3aed;
  --purple-dark: #5b21b6;
  --accent: #a855f7;
}

/* Light theme body overrides */
.light-theme body,
.light-theme .root {
  background: none;
}
.light-theme body {
  background: radial-gradient(ellipse at 20% 10%, #d8c8ff 0%, #f5f0ff 55%),
              radial-gradient(ellipse at 80% 90%, #e8d4ff 0%, transparent 55%);
}

/* Cards/panels in light mode */
.light-theme .menu-card {
  background: rgba(255,255,255,0.75);
  border-color: rgba(140,90,210,0.25);
}
.light-theme .hud-card {
  background: rgba(255,255,255,0.75);
  border-color: rgba(140,90,210,0.22);
}
.light-theme .hud-val {
  background: linear-gradient(135deg, #2d0a5e 0%, #7c3aed 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.light-theme .hud-card--score .hud-val {
  background: linear-gradient(135deg, #1a0a2e 0%, #7c3aed 50%, #a855f7 100%);
  -webkit-background-clip: text; background-clip: text;
}
.light-theme .go-overlay {
  background: rgba(240,230,255,0.96);
}
.light-theme .go-num {
  background: linear-gradient(135deg, #1a0a2e 0%, #7c3aed 50%, #a855f7 100%);
  -webkit-background-clip: text; background-clip: text;
}
.light-theme .gpanel {
  background: rgba(255,255,255,0.55);
  border-color: rgba(140,90,210,0.2);
  box-shadow: 0 0 0 1px rgba(140,90,210,0.06) inset, 0 20px 40px rgba(100,60,180,0.15);
}
.light-theme .cell.inactive {
  background: rgba(140,90,210,0.08);
  border-color: rgba(140,90,210,0.15);
}
.light-theme .pause-card {
  background: rgba(255,255,255,0.95);
  border-color: rgba(140,90,210,0.3);
}
.light-theme .pause-score { color: var(--muted); }
.light-theme .btn-ghost {
  background: rgba(140,90,210,0.1);
  border-color: rgba(140,90,210,0.2);
  color: var(--text);
}
.light-theme .btn-ghost:hover { background: rgba(140,90,210,0.18); }
.light-theme .btn-icon { color: var(--text); background: rgba(140,90,210,0.1); border-color: rgba(140,90,210,0.2); }
.light-theme .btn-link { color: var(--muted); }
.light-theme .btn-link:hover { color: var(--text); }
.light-theme .opt-btn { background: rgba(140,90,210,0.08); border-color: rgba(140,90,210,0.18); color: var(--muted); }
.light-theme .pill-row { background: rgba(140,90,210,0.08); border-color: rgba(140,90,210,0.18); }
.light-theme .pill-opt { color: var(--muted); }
.light-theme .pill-opt--on { color: #fff; }
.light-theme .toast { background: rgba(240,230,255,0.97); border-color: rgba(124,58,237,0.4); color: var(--text); }
.light-theme .go-msg,
.light-theme .go-best { color: var(--muted); }
.light-theme .spd-track { background: rgba(140,90,210,0.12); }
.light-theme .logo { color: var(--text); }
.light-theme .pwr-zone { background: rgba(255,255,255,0.4); border-color: rgba(140,90,210,0.12); }
.light-theme .phud-score {
  background: linear-gradient(135deg, #1a0a2e 0%, #7c3aed 100%);
  -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
}
.light-theme .lb-row { background: rgba(255,255,255,0.7); }
.light-theme .how-row { background: rgba(255,255,255,0.7); }
.light-theme .go-input { background: rgba(255,255,255,0.8); color: var(--text); }
.light-theme .share-inner { background: rgba(255,255,255,0.8); }
.light-theme .share-url { color: var(--muted); }
.light-theme .share-social--copy { background: rgba(140,90,210,0.1); color: var(--text); border-color: rgba(140,90,210,0.2); }
.light-theme .kb-panel { background: #f5f0ff; color: var(--text); }
.light-theme .kb-cell { background: rgba(140,90,210,0.1); border-color: rgba(140,90,210,0.2); color: var(--text); }
.light-theme .kb-cell--on { background: var(--purple); color: #fff; border-color: var(--purple); }
.light-theme .pwr-chip--shield { background: linear-gradient(135deg,#0e7490,#06b6d4); }
.light-theme .pwr-chip--freeze { background: linear-gradient(135deg,#1d4ed8,#60a5fa); }
.light-theme .pwr-chip--mult   { background: linear-gradient(135deg,#c2410c,#f97316); }
.light-theme .pause-settings-row .pause-setting-btn { background: rgba(140,90,210,0.1); border-color: rgba(140,90,210,0.2); color: var(--text); }
.light-theme .pause-settings-row .pause-setting-btn:hover { background: rgba(140,90,210,0.2); }

html, body { height: 100%; background: var(--bg); overflow: hidden; touch-action: none; }
body {
  font-family: var(--font-ui);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  background: radial-gradient(ellipse at 20% 10%, #2d1060 0%, #0d0820 55%),
              radial-gradient(ellipse at 80% 90%, #1a0a3e 0%, transparent 55%);
  user-select: none;
}

/* ── Root layout ── */
.root {
  display: flex; flex-direction: column; align-items: center;
  width: 100%; max-width: 520px; margin: 0 auto;
  padding: 8px 10px 12px; min-height: 100dvh; gap: 8px;
  position: relative; z-index: 10; overflow: hidden;
}
.root--2p { --cell: var(--cell-2p); }

/* ── Background orbs ── */
.bg-pulse {
  position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background: radial-gradient(circle at 50% 50%, var(--purple) 0%, transparent 60%);
  opacity: 0.04; transition: opacity 0.8s, background 1s;
}
.orb {
  position: fixed; border-radius: 50%; filter: blur(80px);
  z-index: -2; pointer-events: none;
}
.orb-1 {
  width: 480px; height: 480px; opacity: 0.20;
  background: radial-gradient(circle at 35% 35%, #e879f9, #7c3aed 55%, #4c1d95);
  top: calc(50% - 240px); left: calc(50% - 240px);
  animation: orbFloat1 20s ease-in-out infinite;
  transition: background 1s;
}
.orb-2 {
  width: 320px; height: 320px; opacity: 0.12;
  background: radial-gradient(circle at 60% 40%, #60a5fa, #2563eb);
  top: calc(50% - 160px); left: calc(50% - 160px);
  animation: orbFloat2 14s ease-in-out infinite;
}
.orb-3 {
  width: 240px; height: 240px; opacity: 0.10;
  background: radial-gradient(circle at 50% 30%, #f9a8d4, #be185d);
  top: calc(50% - 120px); left: calc(50% - 120px);
  animation: orbFloat3 10s ease-in-out infinite;
}
@keyframes orbFloat1 {
  0%,100% { transform: translate(-140px,-160px) scale(1); }
  25%  { transform: translate(160px,-120px) scale(1.08); }
  50%  { transform: translate(120px,160px) scale(0.96); }
  75%  { transform: translate(-160px,120px) scale(1.04); }
}
@keyframes orbFloat2 {
  0%,100% { transform: translate(160px,80px) scale(1); }
  33%  { transform: translate(-80px,140px) scale(1.1); }
  66%  { transform: translate(-140px,-80px) scale(0.9); }
}
@keyframes orbFloat3 {
  0%,100% { transform: translate(60px,-120px) scale(1); }
  50%  { transform: translate(-120px,80px) scale(1.15); }
}

/* ── Rare color splash ── */
.rare-splash {
  position: fixed; inset: 0; z-index: 999; pointer-events: none;
  display: flex; align-items: center; justify-content: center;
  animation: rareSplashAnim 5s cubic-bezier(0.22,1,0.36,1) forwards;
}
.rare-splash-text {
  font-family: var(--font-game);
  font-size: clamp(36px, 12vw, 72px);
  font-weight: 900; text-align: center; line-height: 1.1;
  text-transform: uppercase; letter-spacing: 2px;
  animation: rareSplashText 5s cubic-bezier(0.22,1,0.36,1) forwards;
}
@keyframes rareSplashAnim {
  0%   { background: rgba(0,0,0,0.75); }
  15%  { background: rgba(0,0,0,0.6); }
  60%  { background: rgba(0,0,0,0.35); }
  85%  { background: rgba(0,0,0,0.1); }
  100% { background: rgba(0,0,0,0); opacity: 0; }
}
@keyframes rareSplashText {
  0%   { transform: scale(0.1) rotate(-10deg); opacity: 0; }
  12%  { transform: scale(1.15) rotate(2deg);  opacity: 1; }
  25%  { transform: scale(1) rotate(0deg); }
  70%  { transform: scale(1) rotate(0deg); opacity: 1; }
  100% { transform: scale(1.6) rotate(5deg); opacity: 0; }
}

/* ── Screen shake ── */
.shake-screen { animation: screenShake 0.45s cubic-bezier(.36,.07,.19,.97) both; }
@keyframes screenShake {
  0%,100% { transform: translate(0,0) rotate(0deg); }
  15%  { transform: translate(-6px, 4px) rotate(-0.4deg); }
  30%  { transform: translate(6px,-4px) rotate(0.4deg); }
  45%  { transform: translate(-8px, 5px) rotate(-0.5deg); }
  60%  { transform: translate(8px,-5px) rotate(0.5deg); }
  75%  { transform: translate(4px,-3px) rotate(0.2deg); }
  90%  { transform: translate(-3px, 2px) rotate(-0.1deg); }
}

/* ── Toast ── */
.toast {
  position: fixed; top: 158px; bottom: auto;
  left: 50%; transform: translateX(-50%);
  background: rgba(15,8,35,0.97); border: 2px solid rgba(192,38,211,0.5);
  backdrop-filter: blur(20px); border-radius: 99px;
  padding: 9px 24px; font-family: var(--font-game); font-size: 15px;
  color: var(--text); z-index: 500; white-space: nowrap;
  animation: toastIn 0.3s cubic-bezier(0.22,1,0.36,1);
  pointer-events: none;
  box-shadow: 0 4px 24px rgba(192,38,211,0.35);
}
@keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(-10px) scale(0.9); } }

/* ── Header ── */
.hdr {
  width: 100%; display: flex; align-items: center; justify-content: space-between;
  transition: height 0.3s, opacity 0.3s; min-height: 44px;
}
.hdr--hidden { height: 0 !important; overflow: hidden; opacity: 0; pointer-events: none; min-height: 0; }
.logo {
  font-family: var(--font-game); font-size: 16px; letter-spacing: 0.3px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
.txt-p {
  color: var(--purple); text-shadow: 0 0 20px rgba(192,38,211,0.6);
  transition: color 0.5s, text-shadow 0.5s;
}
.hdr-right { display: flex; gap: 6px; }

/* ── Fullscreen floating controls ── */
.fs-controls {
  position: fixed; top: 10px; right: 10px; z-index: 600;
  display: flex; gap: 6px; flex-direction: column;
}

/* ── Fullscreen pull-down tab — tap to restore header ── */
.fs-pulldown {
  position: fixed; top: 0; left: auto; right: 16px; transform: none;
  z-index: 601; cursor: pointer;
  background: linear-gradient(180deg, rgba(45,16,96,0.92), rgba(13,8,32,0.85));
  border: 2px solid rgba(192,38,211,0.35); border-top: none;
  border-radius: 0 0 18px 18px;
  padding: 2px 22px 6px;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 12px rgba(192,38,211,0.15);
  transition: padding-bottom 0.2s, box-shadow 0.2s;
  animation: pulldownIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
}
.fs-pulldown:hover { padding-bottom: 10px; box-shadow: 0 6px 24px rgba(0,0,0,0.5), 0 0 18px rgba(192,38,211,0.3); }
.fs-pulldown:active { transform: scale(0.96); }
@keyframes pulldownIn { from { transform: translateY(-100%); } to { transform: translateY(0); } }
.fs-pulldown-chevron {
  font-size: 20px; color: var(--accent); line-height: 1;
  animation: chevronBounce 1.8s ease-in-out infinite;
  display: block;
}
@keyframes chevronBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(3px)} }

/* ── Icon buttons ── */
.btn-icon {
  background: rgba(255,255,255,0.08); border: 2px solid rgba(255,255,255,0.15);
  border-radius: 12px; width: 38px; height: 38px; font-size: 16px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text); transition: all 0.15s ease;
  backdrop-filter: blur(10px); box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.btn-icon:hover, .btn-icon:active { background: rgba(192,38,211,0.25); border-color: var(--purple); transform: scale(0.95); }

/* ── Pause inline button (in HUD / 2P panel) ── */
.btn-pause-inline {
  background: rgba(255,255,255,0.08); border: 2px solid rgba(255,255,255,0.15);
  border-radius: 10px; width: 34px; height: 34px; font-size: 14px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text); transition: all 0.15s; flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.btn-pause-inline:active { transform: scale(0.9); background: rgba(192,38,211,0.3); }

/* ── Pause overlay ── */
.pause-overlay {
  position: fixed; inset: 0; z-index: 800;
  background: rgba(5,2,18,0.85); backdrop-filter: blur(14px);
  display: flex; align-items: center; justify-content: center; padding: 20px;
  animation: fadeIn 0.25s ease;
}
.pause-card {
  background: linear-gradient(145deg, rgba(45,16,96,0.9), rgba(13,8,32,0.95));
  border: 2px solid rgba(192,38,211,0.4); border-radius: 28px;
  padding: 32px 28px; width: 100%; max-width: 340px;
  display: flex; flex-direction: column; gap: 16px; align-items: center;
  box-shadow: 0 0 60px rgba(192,38,211,0.2), 0 32px 64px rgba(0,0,0,0.5);
}
.pause-title {
  font-family: var(--font-game); font-size: 32px; letter-spacing: 2px;
  background: linear-gradient(135deg, #f0abfc, #c026d3);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.pause-score { font-family: var(--font-ui); font-size: 14px; color: var(--muted); }

/* ── Settings Drawer ── */
.drawer-overlay {
  position: fixed; inset: 0; z-index: 700;
  background: rgba(0,0,0,0.5); backdrop-filter: blur(6px);
  display: flex; align-items: flex-start; justify-content: flex-end;
}
.drawer-panel {
  width: 290px; height: 100%; max-height: 100dvh; overflow-y: auto;
  background: linear-gradient(180deg, #1a0a3e 0%, #0d0820 100%);
  border-left: 2px solid rgba(192,38,211,0.3);
  padding: 24px 18px; display: flex; flex-direction: column; gap: 22px;
  box-shadow: -20px 0 60px rgba(0,0,0,0.6);
  animation: slideInRight 0.28s cubic-bezier(0.22,1,0.36,1);
}
.light-theme .drawer-panel { background: linear-gradient(180deg, #f0e8ff, #e8d8ff); border-left-color: rgba(124,58,237,0.3); }
@keyframes slideInRight { from { transform: translateX(100%); } }
.drawer-header { display: flex; align-items: center; justify-content: space-between; }
.drawer-title { font-family: var(--font-game); font-size: 18px; color: var(--accent); }

/* ── Menu card ── */
.menu-card {
  width: 100%;
  background: linear-gradient(145deg, rgba(45,16,96,0.7), rgba(13,8,32,0.8));
  border: 2px solid rgba(192,38,211,0.25); border-radius: 28px; padding: 24px;
  backdrop-filter: blur(var(--panel-blur)) saturate(160%);
  display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 64px rgba(0,0,0,0.5), 0 0 40px rgba(192,38,211,0.08);
}
.menu-header { display: flex; flex-direction: column; gap: 4px; }
.menu-title {
  font-family: var(--font-game); font-size: clamp(26px, 8vw, 42px);
  line-height: 1.05; letter-spacing: 0.5px;
  text-shadow: 0 3px 12px rgba(0,0,0,0.5), 0 0 30px rgba(192,38,211,0.2);
}
.menu-sub { font-size: 13px; color: var(--muted); font-weight: 700; letter-spacing: 0.3px; }
.menu-links { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

/* ── Buttons ── */
.btn-play {
  width: 100%;
  background: linear-gradient(135deg, #a21caf, #c026d3, #7c3aed);
  color: #fff; border: none; border-radius: 16px; padding: 16px;
  font-family: var(--font-game); font-size: 18px; letter-spacing: 1px;
  cursor: pointer; transition: all 0.18s;
  box-shadow: 0 6px 0 #6b21a8, 0 8px 24px rgba(192,38,211,0.4);
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
.btn-play:hover { transform: translateY(-2px); box-shadow: 0 8px 0 #6b21a8, 0 12px 32px rgba(192,38,211,0.5); }
.btn-play:active { transform: translateY(3px); box-shadow: 0 3px 0 #6b21a8, 0 6px 16px rgba(192,38,211,0.3); }

.btn-primary {
  background: linear-gradient(135deg, #9333ea, #c026d3);
  color: #fff; border: none; border-radius: 14px; padding: 12px 20px;
  font-family: var(--font-game); font-size: 15px; cursor: pointer;
  box-shadow: 0 4px 0 #6b21a8, 0 6px 16px rgba(192,38,211,0.35);
  transition: all 0.15s;
}
.btn-primary:hover { transform: translateY(-1px); }
.btn-primary:active { transform: translateY(2px); box-shadow: 0 2px 0 #6b21a8; }
.btn-sm { padding: 9px 14px; font-size: 13px; }

.btn-ghost {
  background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.12);
  color: var(--text); padding: 10px 18px; border-radius: 14px;
  font-family: var(--font-game); font-size: 14px; cursor: pointer; transition: all 0.15s;
  box-shadow: 0 3px 0 rgba(0,0,0,0.3);
}
.btn-ghost:hover { background: rgba(255,255,255,0.12); transform: translateY(-1px); }
.btn-ghost:active { transform: translateY(2px); box-shadow: none; }

.btn-link {
  background: none; border: none; color: var(--muted); font-family: var(--font-ui);
  font-size: 13px; font-weight: 800; cursor: pointer; padding: 4px 10px;
  border-radius: 8px; transition: color 0.15s;
}
.btn-link:hover { color: var(--text); }

/* ── Options ── */
.opt-grid { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.opt-section { display: flex; flex-direction: column; gap: 6px; }
.opt-label { font-family: var(--font-ui); font-size: 10px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); }
.opt-row { display: flex; gap: 6px; }
.opt-btn {
  flex: 1; padding: 9px 6px; background: var(--bg2); border: 2px solid var(--glass-border);
  border-radius: 10px; color: var(--muted); font-family: var(--font-ui); font-size: 13px;
  font-weight: 800; cursor: pointer; transition: all 0.15s;
}
.opt-btn--on { background: var(--purple); color: #fff; border-color: var(--purple); box-shadow: 0 3px 0 var(--purple-dark); }

/* ── Pill toggle ── */
.pill-row { position: relative; display: flex; background: var(--bg2); border: 2px solid var(--glass-border); border-radius: 14px; padding: 3px; }
.pill-thumb {
  position: absolute; top: 3px; bottom: 3px;
  background: linear-gradient(135deg, var(--purple), var(--purple-dark));
  border-radius: 11px; box-shadow: 0 3px 0 var(--purple-dark), 0 4px 12px rgba(192,38,211,0.4);
  transition: left 0.2s cubic-bezier(0.34,1.56,0.64,1), width 0.2s; pointer-events: none; z-index: 0;
}
.pill-opt {
  flex: 1; position: relative; z-index: 1; padding: 8px 4px;
  border: none; background: transparent; font-family: var(--font-ui); font-size: 12px;
  font-weight: 800; cursor: pointer; border-radius: 11px; color: var(--muted);
  transition: color 0.18s; text-align: center; white-space: nowrap;
}
.pill-opt--on { color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }

/* ── HUD ── */
.hud {
  width: 100%; display: flex; gap: 7px; align-items: stretch;
}
.hud-card {
  flex: 1; background: linear-gradient(145deg, rgba(45,16,96,0.6), rgba(13,8,32,0.7));
  border: 2px solid rgba(192,38,211,0.2); border-radius: 14px; padding: 8px 10px;
  display: flex; flex-direction: column; gap: 1px;
  box-shadow: 0 3px 0 rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2);
  transition: border-color 0.3s;
}
.hud-card--hearts { display: flex; flex-direction: column; justify-content: center; gap: 3px; flex: none; }
.hud-lbl { font-family: var(--font-ui); font-size: 8px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); }
.hud-val {
  font-family: var(--font-game); font-size: 24px; line-height: 1; letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #f0eaff 0%, #c084fc 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.hud-val--sm { font-size: 18px; }
.hud-card--score .hud-val {
  background: linear-gradient(135deg, #fff 0%, #f0abfc 50%, #c026d3 100%);
  -webkit-background-clip: text; background-clip: text;
}

/* ── HUD score row — combo inline ── */
.hud-score-row { display: flex; align-items: center; gap: 6px; line-height: 1; flex-wrap: nowrap; }
.hud-card--score { gap: 2px; min-width: 80px; }
.hud-card--score .hud-val { font-size: 26px; }
.combo-wrap { flex-shrink: 0; }

/* ── Speed bar ── */
.spd-wrap { width: 100%; padding: 0 2px; }
.spd-track { width: 100%; height: 5px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; }
.spd-fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, #c026d3, #f0abfc, #fbbf24);
  transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
  box-shadow: 0 0 10px rgba(192,38,211,0.7);
}

/* ── Game area ── */
.game-area {
  position: relative; width: 100%;
  display: flex; justify-content: center; align-items: center;
  gap: 16px; flex: 1; min-height: 0;
  /* Extra top padding so a spinning evolve grid never clips the HUD/speed bar */
  padding-top: 8px;
}

/* Duo mode side-by-side layout is handled above */

/* gpanel gets overflow-visible so spin doesn't clip to panel bounds */
.gpanel { overflow: visible; }

/* Wrapper that keeps the rotating gpanel from affecting document flow */
.ppanel { overflow: visible; }

/* ── Game Over overlay ── */
.go-overlay {
  position: absolute; inset: 0; z-index: 50; border-radius: 22px;
  background: rgba(5,2,18,0.92); backdrop-filter: blur(16px);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; padding: 20px; text-align: center; animation: fadeIn 0.4s ease;
}
@keyframes fadeIn { from { opacity: 0; } }
.go-eyebrow { font-family: var(--font-ui); font-size: 10px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: var(--muted); }
.go-num {
  font-family: var(--font-game); font-size: clamp(52px, 18vw, 76px); line-height: 1;
  letter-spacing: -2px; font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #fff 0%, #f0abfc 50%, #c026d3 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.go-best { font-family: var(--font-ui); font-size: 13px; color: var(--muted); font-weight: 700; }
.go-msg { font-family: var(--font-ui); font-size: 12px; color: var(--muted); font-style: italic; max-width: 240px; }
.go-winner { font-family: var(--font-game); font-size: 22px; }
.go-pair { display: flex; align-items: center; gap: 16px; }
.go-col { display: flex; flex-direction: column; align-items: center; gap: 3px; }
.go-plbl { font-family: var(--font-ui); font-size: 11px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
.go-score { font-family: var(--font-game); font-size: 38px; }
.go-sep { width: 1px; height: 50px; background: var(--glass-border); }
.go-btns { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; width: 100%; }
.go-lb-form { display: flex; gap: 8px; width: 100%; max-width: 300px; flex-wrap: wrap; justify-content: center; }
.go-input {
  flex: 1 1 80px; background: rgba(255,255,255,0.08); border: 2px solid rgba(192,38,211,0.3);
  border-radius: 12px; padding: 10px 12px; color: var(--text);
  font-family: var(--font-game); font-size: 18px;
  text-align: center; letter-spacing: 3px; outline: none;
}
.go-input:focus { border-color: var(--purple); box-shadow: 0 0 0 3px rgba(192,38,211,0.2); }
.go-lb-saved { font-family: var(--font-ui); font-size: 13px; font-weight: 900; color: #4ade80; }
.go-bug-btn {
  font-family: var(--font-ui); font-size: 11px; font-weight: 800; color: var(--muted);
  text-decoration: none; opacity: 0.55; transition: opacity 0.15s; letter-spacing: 0.3px;
  padding: 4px 10px; border-radius: 8px;
}
.go-bug-btn:hover { opacity: 1; color: var(--text); }

/* ── Player panel ── */
.ppanel { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.ppanel--dead { opacity: 0.4; pointer-events: none; filter: grayscale(0.6); }
.plabel-row { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0 4px; }
.plabel { font-family: var(--font-game); font-size: 13px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); }

/* ── 2P in-panel HUD ── */
.phud { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 0 4px; min-height: 36px; }
.phud-score {
  font-family: var(--font-game); font-size: 26px; line-height: 1; letter-spacing: -0.5px; font-variant-numeric: tabular-nums;
  background: linear-gradient(135deg, #fff 0%, #f0abfc 50%, #c026d3 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

/* ── Hearts ── */
.hearts { display: flex; gap: 3px; }
.heart { font-size: 18px; transition: all 0.2s; line-height: 1; }
.heart--full  { color: #c026d3; filter: drop-shadow(0 0 7px rgba(192,38,211,0.7)); }
.heart--shield{ color: #60a5fa; filter: drop-shadow(0 0 8px rgba(96,165,250,0.8)); animation: shieldPulse 1s ease-in-out infinite; }
.heart--empty { color: var(--muted); opacity: 0.22; }
.heart--loss  { animation: heartPop 0.4s cubic-bezier(0.22,1,0.36,1); }
@keyframes heartPop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.6)} }
@keyframes shieldPulse { 0%,100%{filter:drop-shadow(0 0 6px rgba(96,165,250,0.7))} 50%{filter:drop-shadow(0 0 12px rgba(96,165,250,1))} }

/* ── Combo — sits inside score hud-card ── */
.combo-wrap {
  font-family: var(--font-game); font-size: 11px; letter-spacing: 0.5px;
  color: #fff; background: linear-gradient(135deg, var(--purple), var(--purple-dark));
  border-radius: 20px; padding: 1px 8px; align-self: flex-start;
  box-shadow: 0 2px 0 var(--purple-dark), 0 3px 8px rgba(192,38,211,0.4);
  animation: comboPop 0.25s cubic-bezier(0.22,1,0.36,1);
}
@keyframes comboPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }

/* ── Power-up chips (match level-up badge style) ── */
.pwr-pills { display: flex; gap: 6px; align-items: center; flex-wrap: nowrap; justify-content: center; min-height: 26px; }
.pwr-chip {
  display: inline-flex; align-items: center; gap: 5px;
  border-radius: 99px; padding: 4px 10px 4px 7px;
  font-family: var(--font-game); font-size: 13px; font-weight: 800;
  box-shadow: 0 2px 0 rgba(0,0,0,0.3), 0 4px 10px rgba(0,0,0,0.2);
  animation: chipPop 0.25s cubic-bezier(0.22,1,0.36,1);
}
@keyframes chipPop { 0%{transform:scale(0.6);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
.pwr-chip--shield { background: linear-gradient(135deg,#0e7490,#06b6d4); color:#fff; box-shadow: 0 2px 0 #164e63, 0 4px 10px rgba(6,182,212,0.4); }
.pwr-chip--freeze { background: linear-gradient(135deg,#1d4ed8,#60a5fa); color:#fff; box-shadow: 0 2px 0 #1e3a8a, 0 4px 10px rgba(96,165,250,0.4); }
.pwr-chip--mult   { background: linear-gradient(135deg,#c2410c,#f97316); color:#fff; box-shadow: 0 2px 0 #7c2d12, 0 4px 10px rgba(249,115,22,0.4); }
.pwr-chip-icon { font-size: 15px; line-height: 1; }
.pwr-chip-bar-track { flex:1; height:6px; background:rgba(255,255,255,0.2); border-radius:99px; overflow:hidden; min-width:40px; }
.pwr-chip-bar { height:100%; border-radius:99px; transition:width 0.1s linear; }
.pwr-chip-bar--freeze { background:linear-gradient(90deg,#bfdbfe,#fff); }
.pwr-chip-bar--mult { background:linear-gradient(90deg,#fb923c,#fff); }

/* ── Level-up side badge ── */
.levelup-badge {
  display: inline-flex; align-items: center; gap: 4px;
  border-radius: 99px; padding: 4px 12px;
  background: linear-gradient(135deg, #a21caf, #c026d3);
  color: #fff; font-family: var(--font-game); font-size: 13px;
  box-shadow: 0 2px 0 #6b21a8, 0 4px 12px rgba(192,38,211,0.45);
  animation: chipPop 0.3s cubic-bezier(0.22,1,0.36,1);
}

/* ── Grid panel ── */
.gpanel {
  background: transparent; border: none; box-shadow: none;
  border-radius: 20px; padding: 6px; display: grid; gap: var(--gap);
  transform-origin: center center;
  overflow: visible;
  transition: grid-template-columns 0.35s cubic-bezier(0.34,1.56,0.64,1),
              grid-template-rows 0.35s cubic-bezier(0.34,1.56,0.64,1);
}
.gpanel.shake-grid { animation: gridShake 0.4s cubic-bezier(.36,.07,.19,.97) both; animation-fill-mode: none; }
@keyframes gridShake { 0%,100%{translate:0 0} 20%{translate:-5px 3px} 40%{translate:5px -3px} 60%{translate:-4px 2px} 80%{translate:3px -2px} }

/* ── Void cell ── */
.cell-void { width: var(--cell); height: var(--cell); background: transparent; border: none; pointer-events: none; opacity: 0; }

/* ── Cells ── */
.cell {
  width: var(--cell); height: var(--cell); border-radius: var(--r);
  border: none; cursor: pointer; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.08s cubic-bezier(0.4,0,0.2,1), box-shadow 0.1s;
  -webkit-tap-highlight-color: transparent;
}
.cell:active { transform: scale(0.9) !important; }
.cell.inactive { background: rgba(255,255,255,0.04); border: 2px solid rgba(255,255,255,0.07); cursor: default; }
.cell.inactive::before { display: none; }
.cell--press { transform: scale(0.88) !important; }

/* Cell glossy shine */
.cell::before {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(145deg, rgba(255,255,255,0.25) 0%, transparent 55%);
  pointer-events: none; z-index: 1;
}

/* Cell inner content wrapper */
.cell > span:first-child { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }

.sym { position: relative; z-index: 3; font-size: 22px; line-height: 1; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.5)); }

/* Cell colors */
.cell { clip-path: none !important; }
.cell-tri-shape {
  position: absolute; inset: 0; border-radius: inherit;
  clip-path: polygon(50% 6%, 94% 92%, 6% 92%);
  pointer-events: none;
}
/* Triangle color overlays */
.cell.triangle-white .cell-tri-shape,
.cell.white.triangle .cell-tri-shape   { background: linear-gradient(145deg,#fff,#c7d2e8); }
.cell.triangle-blue .cell-tri-shape,
.cell.blue.triangle .cell-tri-shape    { background: linear-gradient(145deg,#60a5fa,#2563eb); }
.cell.triangle-red .cell-tri-shape,
.cell.red.triangle .cell-tri-shape     { background: linear-gradient(145deg,#f87171,#dc2626); }
.cell.triangle-orange .cell-tri-shape,
.cell.orange.triangle .cell-tri-shape  { background: linear-gradient(145deg,#fb923c,#ea580c); }
.cell.triangle-yellow .cell-tri-shape,
.cell.yellow.triangle .cell-tri-shape  { background: linear-gradient(145deg,#fde047,#ca8a04); }
.cell.triangle-green .cell-tri-shape,
.cell.green.triangle .cell-tri-shape   { background: linear-gradient(145deg,#4ade80,#16a34a); }
.cell.triangle-cyan .cell-tri-shape,
.cell.cyan.triangle .cell-tri-shape    { background: linear-gradient(145deg,#22d3ee,#0891b2); }
.cell.triangle-lime .cell-tri-shape,
.cell.lime.triangle .cell-tri-shape    { background: linear-gradient(145deg,#a3e635,#65a30d); }
.cell.triangle-teal .cell-tri-shape,
.cell.teal.triangle .cell-tri-shape    { background: linear-gradient(145deg,#2dd4bf,#0f766e); }
.cell.triangle-pink .cell-tri-shape,
.cell.pink.triangle .cell-tri-shape    { background: linear-gradient(145deg,#f472b6,#db2777); }
.cell.triangle-rose .cell-tri-shape,
.cell.rose.triangle .cell-tri-shape    { background: linear-gradient(145deg,#fb7185,#e11d48); }
.cell.triangle-magenta .cell-tri-shape,
.cell.magenta.triangle .cell-tri-shape { background: linear-gradient(145deg,#e879f9,#a21caf); }
.cell.triangle-purple .cell-tri-shape,
.cell.purple.triangle .cell-tri-shape  { background: linear-gradient(145deg,#d946ef,#7c3aed); }
.cell.white   { background: linear-gradient(145deg,#fff,#c7d2e8); box-shadow: 0 4px 0 #8fa0bb, 0 5px 14px rgba(200,210,230,0.4); }
.cell.blue    { background: linear-gradient(145deg,#60a5fa,#2563eb); box-shadow: 0 4px 0 #1e40af, 0 5px 14px rgba(59,130,246,0.5); }
.cell.red     { background: linear-gradient(145deg,#f87171,#dc2626); box-shadow: 0 4px 0 #991b1b, 0 5px 14px rgba(239,68,68,0.5); }
.cell.orange  { background: linear-gradient(145deg,#fb923c,#ea580c); box-shadow: 0 4px 0 #9a3412, 0 5px 14px rgba(249,115,22,0.5); }
.cell.yellow  { background: linear-gradient(145deg,#fde047,#ca8a04); box-shadow: 0 4px 0 #854d0e, 0 5px 14px rgba(234,179,8,0.5); }
.cell.green   { background: linear-gradient(145deg,#4ade80,#16a34a); box-shadow: 0 4px 0 #14532d, 0 5px 14px rgba(34,197,94,0.5); }
.cell.cyan    { background: linear-gradient(145deg,#22d3ee,#0891b2); box-shadow: 0 4px 0 #164e63, 0 5px 14px rgba(6,182,212,0.5); }
.cell.lime    { background: linear-gradient(145deg,#a3e635,#65a30d); box-shadow: 0 4px 0 #365314, 0 5px 14px rgba(132,204,22,0.5); }
.cell.teal    { background: linear-gradient(145deg,#2dd4bf,#0f766e); box-shadow: 0 4px 0 #134e4a, 0 5px 14px rgba(20,184,166,0.5); }
.cell.pink    { background: linear-gradient(145deg,#f472b6,#db2777); box-shadow: 0 4px 0 #831843, 0 5px 14px rgba(236,72,153,0.5); }
.cell.rose    { background: linear-gradient(145deg,#fb7185,#e11d48); box-shadow: 0 4px 0 #881337, 0 5px 14px rgba(244,63,94,0.5); }
.cell.magenta { background: linear-gradient(145deg,#e879f9,#a21caf); box-shadow: 0 4px 0 #701a75, 0 5px 14px rgba(217,70,239,0.5); }
.cell.purple  {
  background: linear-gradient(145deg,#d946ef,#7c3aed);
  box-shadow: 0 4px 0 #4c1d95, 0 5px 16px rgba(192,38,211,0.5);
  animation: purplePulse 1.5s ease-in-out infinite;
}
@keyframes purplePulse {
  0%,100% { box-shadow: 0 4px 0 #4c1d95, 0 5px 16px rgba(192,38,211,0.5); }
  50%      { box-shadow: 0 4px 0 #4c1d95, 0 5px 28px rgba(192,38,211,0.8), 0 0 0 3px rgba(192,38,211,0.2); }
}

/* Power-up cells */
.cell.medpack    { background: linear-gradient(145deg,#fcd34d,#d97706); box-shadow: 0 4px 0 #92400e, 0 5px 14px rgba(251,191,36,0.5); }
.cell.shield     { background: linear-gradient(145deg,#67e8f9,#0891b2); box-shadow: 0 4px 0 #164e63, 0 5px 14px rgba(6,182,212,0.5); }
.cell.freeze     { background: linear-gradient(145deg,#bfdbfe,#3b82f6); box-shadow: 0 4px 0 #1e3a8a, 0 5px 14px rgba(147,197,253,0.5); }
.cell.multiplier { background: linear-gradient(145deg,#fb923c,#ea580c); box-shadow: 0 4px 0 #9a3412, 0 5px 14px rgba(249,115,22,0.5); }

/* Ice, Hold, Slider cells */
.cell.ice {
  background: linear-gradient(145deg,#e0f2fe,#7dd3fc,#2563eb);
  box-shadow: 0 4px 0 #1e40af, 0 5px 14px rgba(96,165,250,0.6);
}
.cell.hold {
  background: radial-gradient(circle at 50% 35%, #ff6b6b, #cc0000);
  box-shadow: 0 5px 0 #7f0000, 0 6px 20px rgba(220,0,0,0.5);
}
/* ── Cell animations ── */
.cell.pop   { animation: pop   0.32s cubic-bezier(0.22,1,0.36,1) forwards; }
.cell.shake { animation: shake 0.42s cubic-bezier(0.36,0.07,0.19,0.97) forwards; }
@keyframes pop {
  0%   { transform: scale(1); opacity: 1; }
  40%  { transform: scale(1.3) rotate(var(--tilt,0deg)); }
  70%  { transform: scale(0.85) rotate(calc(var(--tilt,0deg)*-0.5)); opacity: 0.7; }
  100% { transform: scale(0) rotate(var(--tilt,0deg)); opacity: 0; }
}
@keyframes shake {
  0%,100% { transform: translateX(0) rotate(0deg); }
  20%     { transform: translateX(-10px) rotate(-1.5deg); }
  35%     { transform: translateX(9px)  rotate(1deg); }
  50%     { transform: translateX(-7px) rotate(-0.8deg); }
  65%     { transform: translateX(5px)  rotate(0.5deg); }
  80%     { transform: translateX(-3px) rotate(-0.3deg); }
}
@keyframes newcell { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.cell.newcell { animation: newcell 0.3s cubic-bezier(0.22,1,0.36,1); }

/* ── Ripple ── */
.ripple {
  position: absolute; width: 8px; height: 8px; border-radius: 50%;
  background: rgba(255,255,255,0.65); transform: translate(-50%,-50%) scale(0);
  animation: rippleAnim 0.5s ease-out forwards; pointer-events: none; z-index: 10;
}
@keyframes rippleAnim { to { transform: translate(-50%,-50%) scale(6); opacity: 0; } }

/* ── Shard ── */
.shard {
  position: absolute; width: 6px; height: 6px; border-radius: 2px;
  animation: shardFly 0.42s cubic-bezier(0.22,1,0.36,1) forwards;
  pointer-events: none; z-index: 20;
}
@keyframes shardFly {
  0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx,20px),var(--dy,-20px)) rotate(var(--dr,180deg)) scale(0); opacity: 0; }
}

/* ── Ice overlay ── */
.cell-overlay-ice {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-family: var(--font-game); font-size: 16px; color: #fff; z-index: 4;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5); pointer-events: none; letter-spacing: -1px;
}

/* ── Hold button design ── */
.cell-overlay-hold {
  position: absolute; inset: 0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 2px; z-index: 4; pointer-events: none;
}
.hold-btn-outer {
  width: 78%; aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle at 40% 30%, #ff9999, #cc0000);
  border: 3px solid rgba(255,150,150,0.5);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 0 #7f0000, 0 0 12px rgba(255,0,0,0.4), inset 0 2px 4px rgba(255,200,200,0.3);
  transition: transform 0.1s, box-shadow 0.1s;
}
.hold-btn-inner {
  width: 72%; aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle at 40% 30%, #ff4444, #990000);
  border: 2px solid rgba(255,100,100,0.4);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-game); font-size: 10px; color: #ffcccc;
  letter-spacing: 0.3px; text-shadow: 0 1px 2px rgba(0,0,0,0.6);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
}
.hold-btn-pressed .hold-btn-outer { transform: scaleY(0.88); box-shadow: 0 2px 0 #7f0000, 0 0 18px rgba(255,50,50,0.6); }
.hold-btn-pressed .hold-btn-inner { font-size: 12px; color: #fff; }
.hold-progress {
  position: absolute; bottom: 5px; left: 6px; right: 6px; height: 3px; border-radius: 99px;
  background: rgba(255,255,255,0.25);
}
.hold-progress::after {
  content: ''; position: absolute; inset: 0; border-radius: 99px;
  background: linear-gradient(90deg, #ff6b6b, #fff);
  width: inherit; transition: width 0.05s linear;
}

/* ── Stage badge (removed per item 14, but kept for potential future use) ── */
.stage-badge { display: none; }

/* ── Share card ── */
.share-card { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.share-inner {
  width: 100%;
  background: linear-gradient(135deg, rgba(192,38,211,0.12), rgba(59,130,246,0.08));
  border: 2px solid rgba(192,38,211,0.2); border-radius: 18px; padding: 18px;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.share-logo { font-family: var(--font-game); font-size: 11px; color: var(--muted); }
.share-score {
  font-family: var(--font-game); font-size: 52px; font-weight: 900; line-height: 1; letter-spacing: -2px;
  background: linear-gradient(135deg,#fff,#f0abfc,#c026d3); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.share-mode { font-family: var(--font-ui); font-size: 10px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; color: var(--purple); }
.share-invite { font-family: var(--font-game); font-size: 14px; color: var(--text); margin-top: 2px; }
.share-url { font-size: 10px; color: var(--muted); margin-top: 3px; }
.share-btns { display: flex; gap: 7px; width: 100%; flex-wrap: wrap; }
.share-social {
  flex: 1; min-width: 80px; display: flex; align-items: center; justify-content: center; gap: 5px;
  padding: 10px 6px; border-radius: 12px; font-family: var(--font-ui); font-size: 12px; font-weight: 800;
  cursor: pointer; border: none; text-decoration: none; transition: all 0.15s;
}
.share-social-icon { font-size: 13px; }
.share-social--x   { background: #000; color: #fff; }
.share-social--wa  { background: #25d366; color: #fff; }
.share-social--copy { background: var(--bg2); color: var(--text); border: 2px solid var(--glass-border); }
.share-social:hover { transform: translateY(-1px); }

/* ── Powerup zone — fixed height slot between top UI and grid ── */
.pwr-zone {
  width: 100%; min-height: 40px; display: flex; align-items: center;
  justify-content: center; gap: 6px; flex-wrap: wrap;
}
.pwr-zone--1p { margin-bottom: 2px; }

/* ── 2P phud score row with inline combo ── */
.phud-score-row { display: flex; align-items: center; gap: 6px; }
.combo-wrap--sm { font-size: 10px; padding: 1px 6px; }

/* ── Pause settings row ── */
.pause-settings-row {
  display: flex; gap: 8px; width: 100%; justify-content: center;
}
.pause-setting-btn {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
  background: rgba(255,255,255,0.07); border: 2px solid rgba(255,255,255,0.12);
  border-radius: 14px; padding: 10px 8px; cursor: pointer; color: var(--text);
  font-family: var(--font-ui); font-size: 11px; font-weight: 800;
  transition: all 0.15s;
}
.pause-setting-btn:hover { background: rgba(192,38,211,0.18); border-color: rgba(192,38,211,0.4); transform: translateY(-2px); }
.pause-setting-btn > span { color: var(--muted); font-size: 10px; }

/* ── Keyboard cell vibrancy ── */
.kb-cell {
  padding: 10px 4px; background: var(--bg2); border: 2px solid var(--glass-border);
  border-radius: 9px; color: var(--text); font-family: var(--font-ui); font-size: 13px;
  font-weight: 800; cursor: pointer; transition: all 0.15s; text-align: center;
}
.kb-cell:not(.kb-cell--on):not(.kb-cell--empty) {
  background: linear-gradient(145deg, rgba(140,90,210,0.18), rgba(80,40,160,0.1));
  border-color: rgba(192,38,211,0.28);
  color: var(--text);
  box-shadow: 0 2px 0 rgba(0,0,0,0.3);
}
.kb-cell:not(.kb-cell--on):hover {
  background: linear-gradient(145deg, rgba(192,38,211,0.3), rgba(124,58,237,0.2));
  border-color: rgba(192,38,211,0.55);
  transform: translateY(-1px);
}
.kb-cell--on { background: linear-gradient(135deg, #a21caf, #c026d3); color: #fff; border-color: var(--purple); box-shadow: 0 3px 0 var(--purple-dark), 0 4px 12px rgba(192,38,211,0.4); }
.kb-cell--empty { color: var(--muted); opacity: 0.5; }

/* ── Hover gradient animations on UI cells/cards ── */
.hud-card, .menu-card, .btn-ghost, .btn-primary, .pill-opt, .opt-btn, .lb-row, .how-row {
  position: relative; overflow: hidden;
}
.hud-card::after, .menu-card::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(192,38,211,0.12) 0%, transparent 60%);
  opacity: 0; transition: opacity 0.3s; pointer-events: none; z-index: 0;
}
.hud-card:hover::after, .menu-card:hover::after { opacity: 1; }

/* Cell hover — gradient shimmer */
.cell:not(.inactive):hover {
  filter: brightness(1.18) saturate(1.15);
  transform: scale(1.04) !important;
  transition: transform 0.1s, filter 0.1s, box-shadow 0.1s !important;
}

/* Btn-ghost hover gradient shift */
.btn-ghost::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: linear-gradient(135deg, rgba(192,38,211,0.12), rgba(124,58,237,0.08));
  opacity: 0; transition: opacity 0.2s; pointer-events: none;
}
.btn-ghost:hover::after { opacity: 1; }

/* Pill option hover */
.pill-opt:not(.pill-opt--on):hover {
  color: var(--text);
  background: rgba(192,38,211,0.12);
}

/* LB row hover */
.lb-row { transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s; }
.lb-row:hover { transform: translateX(3px); border-color: rgba(192,38,211,0.3); box-shadow: 0 4px 14px rgba(192,38,211,0.12); }

/* Btn-icon hover */
.btn-icon:hover {
  background: rgba(192,38,211,0.2) !important;
  border-color: rgba(192,38,211,0.45) !important;
  transform: scale(1.08);
}
.btn-icon--pause:hover {
  background: rgba(192,38,211,0.28) !important;
  box-shadow: 0 0 12px rgba(192,38,211,0.35);
}

/* ── Key badge ── */
.kbadge { position: absolute; bottom: 3px; right: 3px; font-size: 7px; font-weight: 900; background: rgba(0,0,0,0.4); color: #fff; padding: 1px 3px; border-radius: 4px; z-index: 5; letter-spacing: 0.5px; }

/* ── Screen slide ── */
.screen-slide { animation: screenSlide 0.3s cubic-bezier(0.22,1,0.36,1); }
@keyframes screenSlide { from { opacity:0; transform:translateX(18px); } }

/* ── Leaderboard ── */
.lb-wrap { width: 100%; display: flex; flex-direction: column; gap: 14px; }
.lb-header { display: flex; align-items: baseline; gap: 10px; }
.lb-title { font-family: var(--font-game); font-size: 22px; }
.lb-sub { font-family: var(--font-ui); font-size: 11px; color: var(--muted); font-weight: 700; }
.lb-empty { font-family: var(--font-ui); font-size: 14px; color: var(--muted); text-align: center; padding: 22px 0; }
.lb-list { display: flex; flex-direction: column; gap: 6px; }
.lb-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg2); border: 2px solid var(--glass-border); border-radius: 14px; }
.lb-row--gold   { border-color: rgba(250,204,21,0.4); background: rgba(250,204,21,0.06); }
.lb-row--silver { border-color: rgba(148,163,184,0.3); }
.lb-row--bronze { border-color: rgba(180,120,60,0.3); }
.lb-rank { font-size: 16px; width: 22px; text-align: center; }
.lb-ini  { font-family: var(--font-game); font-size: 15px; flex: 1; }
.lb-score { font-family: var(--font-game); font-size: 18px; color: var(--purple); }
.lb-date  { font-family: var(--font-ui); font-size: 10px; color: var(--muted); }

/* ── How to play ── */
.how-wrap { width: 100%; display: flex; flex-direction: column; gap: 14px; }
.how-title { font-family: var(--font-game); font-size: 22px; }
.how-grid { display: flex; flex-direction: column; gap: 8px; }
.how-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: var(--bg2); border: 2px solid var(--glass-border); border-radius: 14px; }
.how-icon { font-size: 20px; flex-shrink: 0; }
.how-modes { display: flex; flex-direction: column; gap: 5px; }
.how-mode { font-family: var(--font-ui); font-size: 13px; color: var(--muted); }
.how-tip { font-family: var(--font-ui); font-size: 12px; color: var(--muted); background: var(--bg2); border-radius: 10px; padding: 8px 12px; }

/* ── Key binder ── */
.kb-overlay { position: fixed; inset: 0; z-index: 600; background: rgba(0,0,0,0.55); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.kb-panel { background: #0d0820; border: 2px solid rgba(192,38,211,0.3); border-radius: 22px; padding: 22px; width: 100%; max-width: 350px; display: flex; flex-direction: column; gap: 14px; }
.light-theme .kb-panel { background: #f0e8ff; }
.kb-title { font-family: var(--font-game); font-size: 18px; }
.kb-hint { font-family: var(--font-ui); font-size: 12px; color: var(--muted); }
.kb-tabs { display: flex; gap: 7px; }
.kb-tab { flex: 1; padding: 8px; background: var(--bg2); border: 2px solid var(--glass-border); border-radius: 10px; color: var(--muted); font-family: var(--font-ui); font-weight: 800; cursor: pointer; transition: all 0.15s; }
.kb-tab--on { background: var(--purple); color: #fff; border-color: var(--purple); }
.kb-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 5px; }
.kb-footer { display: flex; justify-content: space-between; align-items: center; }

/* ── Credit footer ── */
.credit { position: fixed; bottom: 8px; left: 0; right: 0; display: flex; align-items: center; justify-content: center; font-family: var(--font-ui); font-size: 10px; color: var(--muted); opacity: 0.45; flex-wrap: wrap; pointer-events: none; gap: 4px; }
.credit-link { color: var(--muted); text-decoration: none; pointer-events: all; transition: opacity 0.15s; }
.credit-link:hover { opacity: 1; }

/* ── Privacy banner — bottom fixed ── */
.privacy-banner { position:fixed; bottom:0; left:0; right:0; z-index:600; background:rgba(13,8,32,0.92); backdrop-filter:blur(12px); border-top:1px solid rgba(192,38,211,0.2); padding:10px 16px; display:flex; align-items:center; justify-content:center; gap:6px; font-family:var(--font-ui); font-size:12px; color:var(--muted); text-align:center; animation:slideUp 0.3s ease; }
@keyframes slideUp { from { transform:translateY(100%); } }
.privacy-txt { display:inline; }
.privacy-link-inline { color:var(--accent); text-decoration:none; }
.privacy-dismiss-btn { background:rgba(255,255,255,0.1); border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:4px 8px; border-radius:4px; margin-left:8px; transition:background 0.15s; }
.privacy-dismiss-btn:hover { background:rgba(255,255,255,0.2); color:var(--text); }

/* ── Menu top row: player pill + inline energy ── */
.menu-top-row { display:flex; align-items:center; justify-content:space-between; gap:10px; }
.player-pill { display:flex; align-items:center; gap:6px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:99px; padding:5px 12px 5px 8px; cursor:pointer; transition:background 0.15s, border-color 0.15s; font-family:var(--font-ui); }
.player-pill:hover { background:rgba(192,38,211,0.15); border-color:rgba(192,38,211,0.35); }
.player-pill-icon { font-size:14px; }
.player-pill-name { font-size:13px; font-weight:800; color:var(--text); max-width:80px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.player-pill-edit { font-size:11px; color:var(--muted); margin-left:2px; }
.energy-inline { display:flex; align-items:center; gap:3px; }
.energy-inline .energy-pip { font-size:14px; }
.energy-inline-timer { font-family:var(--font-ui); font-size:10px; color:var(--muted); margin-left:4px; }

/* ── Stored pwr row — below pwr-zone, no overlap ── */
.stored-pwr-row { display:flex; gap:8px; justify-content:center; padding:2px 0 4px; }

/* ── Overlay glass ── */
.overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.5); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.glass-panel { background: #0d0820; border: 2px solid rgba(192,38,211,0.25); border-radius: 26px; padding: 26px; width: 100%; max-width: 380px; box-shadow: 0 32px 64px rgba(0,0,0,0.4); }
.light-theme .glass-panel { background: #f0e8ff; }

/* ── Grid rotation wrapper ── */
.gpanel-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1);
}

/* ── Rotation direction arrows — UNO-card style, only flash on direction change ── */
.rot-arrows-container {
  position: absolute;
  inset: -60px;
  pointer-events: none;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rot-arrow {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.rot-arrow--cw {
  width: clamp(180px, 60vw, 300px);
  height: clamp(180px, 60vw, 300px);
  color: rgba(192,38,211,0.95);
  filter: drop-shadow(0 0 24px rgba(192,38,211,0.8));
}
.rot-arrow--ccw {
  width: clamp(180px, 60vw, 300px);
  height: clamp(180px, 60vw, 300px);
  color: rgba(96,165,250,0.95);
  filter: drop-shadow(0 0 24px rgba(96,165,250,0.8));
}
.rot-arrow--active {
  animation: unoArrowFlash 2.4s cubic-bezier(0.22,1,0.36,1) forwards;
}
.rot-arrow--cw.rot-arrow--active {
  animation: unoArrowFlashCW 2.4s cubic-bezier(0.22,1,0.36,1) forwards;
}
.rot-arrow--ccw.rot-arrow--active {
  animation: unoArrowFlashCCW 2.4s cubic-bezier(0.22,1,0.36,1) forwards;
}
@keyframes unoArrowFlashCW {
  0%   { opacity: 0;    transform: scale(0.5) rotate(-30deg); }
  15%  { opacity: 0.75; transform: scale(1.12) rotate(8deg); }
  35%  { opacity: 0.55; transform: scale(1.0)  rotate(0deg); }
  60%  { opacity: 0.45; transform: scale(1.0)  rotate(0deg); }
  80%  { opacity: 0.25; transform: scale(1.0)  rotate(0deg); }
  100% { opacity: 0;    transform: scale(0.9)  rotate(-5deg); }
}
@keyframes unoArrowFlashCCW {
  0%   { opacity: 0;    transform: scale(0.5) rotate(30deg); }
  15%  { opacity: 0.75; transform: scale(1.12) rotate(-8deg); }
  35%  { opacity: 0.55; transform: scale(1.0)  rotate(0deg); }
  60%  { opacity: 0.45; transform: scale(1.0)  rotate(0deg); }
  80%  { opacity: 0.25; transform: scale(1.0)  rotate(0deg); }
  100% { opacity: 0;    transform: scale(0.9)  rotate(5deg); }
}

/* ── Continuous grid spin (CSS-only, duration set via inline style) ── */
@keyframes gpanelSpinContinuousCW  { to { transform: rotate(360deg);  } }
@keyframes gpanelSpinContinuousCCW { to { transform: rotate(-360deg); } }

/* ── Grid entry animations (one-shot, triggered on grid change) ── */
.gpanel--spin-cw    { animation: gpanelEntryCW    0.55s cubic-bezier(0.22,1,0.36,1); }
.gpanel--spin-ccw   { animation: gpanelEntryCCW   0.55s cubic-bezier(0.22,1,0.36,1); }
.gpanel--spin-jiggle{ animation: gpanelJiggle     0.55s cubic-bezier(0.22,1,0.36,1); }
@keyframes gpanelEntryCW   { 0%{transform:scale(0.82) rotate(-90deg);opacity:0.3} 60%{transform:scale(1.03) rotate(4deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes gpanelEntryCCW  { 0%{transform:scale(0.82) rotate(90deg);opacity:0.3}  60%{transform:scale(1.03) rotate(-4deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
@keyframes gpanelJiggle    { 0%{transform:scale(0.86) rotate(-8deg);opacity:0.4} 20%{transform:scale(1.06) rotate(6deg);opacity:1} 40%{transform:scale(0.97) rotate(-3deg)} 60%{transform:scale(1.02) rotate(2deg)} 80%{transform:scale(0.99) rotate(-1deg)} 100%{transform:scale(1) rotate(0deg)} }

/* Cell counter-spin at high evolve stages */
@keyframes cellCounterSpin { to { transform: rotate(-360deg); } }

/* ── Duo mode: wide spacing so fingers don't overlap ── */
.root--2p .game-area {
  align-items: center;
  justify-content: space-around;
  gap: 0;
  padding: 8px 4px;
}
.root--2p .ppanel {
  flex: 1;
  align-items: center;
}

/* On narrow/phone screens: stack vertically with generous gap */
@media (max-width: 600px) {
  .root--2p .game-area {
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;
    gap: 0;
    padding: 4px 0 16px;
  }
  .root--2p .ppanel {
    width: 100%;
    max-width: 300px;
  }
  .root--2p {
    --cell: clamp(48px, 13vw, 66px);
  }
}

/* On wider screens keep side-by-side with max separation */
@media (min-width: 601px) {
  .root--2p { max-width: 740px; }
  .root--2p .game-area { gap: 24px; }
}

/* ── Screen transitions ── */
* { transition: background-color 0.4s ease, border-color 0.3s ease, color 0.3s ease; }
.root, .menu-card, .hud-card, .gpanel, .ppanel { transition: all 0.35s cubic-bezier(0.34,1.56,0.64,1); }

/* ── Loading screen ── */
.loading-screen {
  position: fixed; inset: 0; z-index: 9999;
  width: 100vw; height: 100dvh;
  background: linear-gradient(145deg, #0d0820, #1a0a3e);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;
  transition: opacity 0.6s ease, transform 0.6s ease;
  text-align: center;
}
.loading-screen--out { opacity: 0; transform: scale(1.05); pointer-events: none; }
.loading-logo { font-family: 'Fredoka One', system-ui, sans-serif; font-size: clamp(26px,8vw,44px); color: #f0eaff; text-align: center; letter-spacing: 0.5px; }
.loading-purple { color: #c026d3; text-shadow: 0 0 24px rgba(192,38,211,0.7); }
.loading-sub { font-family: 'Nunito', system-ui, sans-serif; font-size: 13px; color: rgba(240,234,255,0.45); font-weight: 700; letter-spacing: 0.3px; }
.loading-bar-track { width: min(280px, 80vw); height: 10px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; border: 1px solid rgba(192,38,211,0.25); }
.loading-bar-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #7c3aed, #c026d3, #f0abfc); transition: width 0.25s ease; box-shadow: 0 0 14px rgba(192,38,211,0.6); }
.loading-pct { font-family: 'Fredoka One', system-ui, sans-serif; font-size: 13px; color: rgba(192,38,211,0.65); }

/* ── Dev overlay ── */
.dev-overlay { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.65); backdrop-filter: blur(4px); display: flex; align-items: stretch; justify-content: flex-end; }
.dev-panel { width: min(340px,95vw); height: 100%; overflow-y: auto; background: #050212; border-left: 1px solid rgba(192,38,211,0.3); padding: 16px; display: flex; flex-direction: column; gap: 3px; }
.dev-title { font-family: monospace; font-size: 11px; font-weight: 900; color: #f0abfc; margin-bottom: 8px; border-bottom: 1px solid rgba(192,38,211,0.2); padding-bottom: 6px; }
.dev-section { font-family: monospace; font-size: 9px; font-weight: 900; color: rgba(192,38,211,0.7); letter-spacing: 1.5px; text-transform: uppercase; margin-top: 8px; margin-bottom: 2px; }
.dev-row { display: flex; justify-content: space-between; gap: 8px; font-family: monospace; font-size: 10px; color: #c0b8e0; padding: 1px 0; }
.dev-key { color: rgba(192,200,255,0.55); flex-shrink: 0; }
.dev-val { color: #88f0a0; word-break: break-all; text-align: right; }
.dev-btn { display: inline-block; background: rgba(192,38,211,0.12); border: 1px solid rgba(192,38,211,0.28); border-radius: 4px; padding: 2px 7px; margin: 2px; cursor: pointer; transition: background 0.12s; font-family: monospace; font-size: 10px; color: #c0b8e0; }
.dev-btn:hover { background: rgba(192,38,211,0.32); color: #fff; }

/* ── Dust widget ── */
.dust-widget { display:flex; align-items:center; gap:4px; background:rgba(192,38,211,0.12); border:1px solid rgba(192,38,211,0.25); border-radius:99px; padding:3px 10px; font-family:var(--font-ui); font-size:13px; font-weight:800; color:var(--accent); cursor:default; }
.dust-icon { font-size:14px; }
.dust-val { letter-spacing:0.3px; }

/* ── Energy bar (standalone, used in no-energy block) ── */
.energy-bar-wrap { display:flex; flex-direction:column; align-items:center; gap:4px; }
.energy-pips { display:flex; gap:4px; }
.energy-pip { font-size:14px; opacity:0.22; transition:opacity 0.25s; filter:grayscale(1); }
.energy-pip--full { opacity:1; filter:none; }
.energy-regen-row { display:flex; align-items:center; gap:8px; }
.energy-timer { font-family:var(--font-ui); font-size:11px; color:var(--muted); }
.energy-refill-btn { background:rgba(192,38,211,0.12); border:1px solid rgba(192,38,211,0.28); border-radius:99px; padding:2px 10px; font-family:var(--font-ui); font-size:11px; font-weight:800; color:var(--accent); cursor:pointer; transition:background 0.15s; }
.energy-refill-btn:hover { background:rgba(192,38,211,0.28); }

/* ── No energy block ── */
.no-energy-block { display:flex; flex-direction:column; align-items:center; gap:4px; padding:14px; background:rgba(255,255,255,0.04); border:1px dashed rgba(192,38,211,0.2); border-radius:16px; margin:4px 0; }
.no-energy-txt { font-family:var(--font-ui); font-size:15px; font-weight:800; color:var(--muted); }
.no-energy-timer { font-family:var(--font-ui); font-size:22px; font-weight:900; color:var(--accent); letter-spacing:1px; }

/* ── Shop ── */
.shop-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
.shop-item { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:14px; padding:12px; display:flex; flex-direction:column; align-items:center; gap:6px; transition:border-color 0.2s; }
.shop-item--equipped { border-color:var(--theme-purple,var(--purple)); background:rgba(192,38,211,0.1); }
.shop-swatch { width:52px; height:52px; border-radius:12px; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.1); }
.shop-name { font-family:var(--font-ui); font-size:13px; font-weight:800; color:var(--text); }

/* ── Loading orbs ── */
.loading-orb { position:absolute; border-radius:50%; filter:blur(60px); pointer-events:none; }
.loading-orb-1 { width:280px; height:280px; background:rgba(192,38,211,0.25); top:-60px; left:-80px; animation:orbFloat 7s ease-in-out infinite; }
.loading-orb-2 { width:200px; height:200px; background:rgba(124,58,237,0.2); bottom:-40px; right:-60px; animation:orbFloat 9s ease-in-out infinite reverse; }
.loading-orb-3 { width:140px; height:140px; background:rgba(240,171,252,0.15); top:50%; left:50%; transform:translate(-50%,-50%); animation:orbFloat 5s ease-in-out infinite; }

/* ── Loading name entry ── */
.loading-name-entry { display:flex; flex-direction:column; align-items:center; gap:10px; margin-top:8px; }
.loading-name-label { font-family:var(--font-ui); font-size:14px; font-weight:800; color:rgba(240,234,255,0.7); }
.loading-name-row { display:flex; gap:8px; align-items:center; }

/* ── Leaderboard mode chip ── */
.lb-mode-chip { flex-shrink:0; }

/* ── Game over dust earned ── */
.go-dust-earned { font-family:var(--font-ui); font-size:14px; font-weight:800; color:var(--accent); background:rgba(192,38,211,0.12); border:1px solid rgba(192,38,211,0.2); border-radius:99px; padding:4px 14px; margin:4px 0; }

.shop-tabs { display:flex; gap:6px; margin-bottom:12px; }
.shop-tab { flex:1; padding:8px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); font-family:var(--font-ui); font-size:13px; font-weight:800; color:var(--muted); cursor:pointer; transition:all 0.15s; }
.shop-tab--on { background:rgba(192,38,211,0.2); border-color:rgba(192,38,211,0.4); color:var(--text); }
.shop-hint { font-size:11px; color:var(--muted); margin-bottom:10px; font-family:var(--font-ui); }
.shop-inventory { display:flex; align-items:center; gap:8px; padding:8px 12px; background:rgba(192,38,211,0.1); border-radius:10px; margin-bottom:10px; }
.shop-inv-lbl { font-size:11px; color:var(--muted); font-family:var(--font-ui); }
.shop-inv-chip { font-size:13px; font-weight:800; font-family:var(--font-ui); color:var(--accent); background:rgba(192,38,211,0.15); padding:2px 8px; border-radius:99px; }
.shop-pwr-list { display:flex; flex-direction:column; gap:8px; }
.shop-pwr-item { display:flex; align-items:center; gap:10px; padding:10px 12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); border-radius:14px; }
.shop-pwr-icon { font-size:20px; min-width:36px; text-align:center; }
.shop-pwr-info { flex:1; }
.shop-pwr-name { font-family:var(--font-ui); font-size:13px; font-weight:800; color:var(--text); }
.shop-pwr-desc { font-family:var(--font-ui); font-size:11px; color:var(--muted); }
.shop-item--bought { animation: shopBought 0.5s ease; }
@keyframes shopBought { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
.stored-pwr-btns { display:flex; gap:6px; justify-content:center; margin-top:4px; }
.stored-pwr-btn { border-radius:99px; border:none; padding:5px 14px; font-family:var(--font-ui); font-size:13px; font-weight:900; cursor:pointer; transition:transform 0.1s, box-shadow 0.1s; }
.stored-pwr-btn:active { transform:scale(0.94); }
.stored-pwr-btn--freeze { background:linear-gradient(135deg,#1d4ed8,#60a5fa); color:#fff; box-shadow:0 4px 14px rgba(96,165,250,0.4); }
.stored-pwr-btn--shield { background:linear-gradient(135deg,#0e7490,#22d3ee); color:#fff; box-shadow:0 4px 14px rgba(34,211,238,0.4); }
`;Zc.createRoot(document.getElementById("root")).render(f.jsx(C_.StrictMode,{children:f.jsx(Bk,{})}));
