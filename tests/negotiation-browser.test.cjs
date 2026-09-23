const { test }=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {loader}=require('./negotiation-loader.cjs');
const key='22222222-2222-4222-8222-222222222222';
function mount(hash='') {
  const storage=new Map(),listeners=new Map(),effects=[],slots=[];let cursor=0;
  const location={hash,pathname:'/products/arctic-wave-perfume',search:'',origin:'https://www.houseofeon.in'};
  const history={replaceState(_a,_b,url){location.hash=url.includes('#')?'#'+url.split('#')[1]:'';}};
  const sessionStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
  const react={useState(value){const i=cursor++;if(!(i in slots))slots[i]=value;return[slots[i],v=>slots[i]=v];},useRef(value){const i=cursor++;return slots[i]||=( {current:value} );},useEffect(fn){cursor++;effects.push(fn);}};
  const load=loader({react,'react/jsx-runtime':{jsx:(type,props)=>({type,props})}}, {}, {
    location,history,sessionStorage,URLSearchParams,window:{addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)},
  });
  const component=load('components/EonPilotWidget.tsx').default;
  let tree=component({publicKey:key});const cleanup=effects[0]();
  cursor=0;tree=component({publicKey:key});
  return {tree,slots,storage,location,listeners,cleanup,render(){cursor=0;return component({publicKey:key});},load};
}
test('ordinary shopper mounts no widget; tester token is fragment/tab only; hidden frame cannot intercept clicks',()=>{
  assert.equal(mount().tree,null);
  const m=mount('#eonTest=private-test-token&keep=1');
  assert.equal(m.storage.get('eon-test:'+key),'private-test-token');
  assert.equal(m.location.hash,'#keep=1');assert.equal(m.tree.type,'iframe');
  assert.equal(m.tree.props.src,'/api/negotiation/widget#eonTest=private-test-token');
  assert.equal(m.tree.props.style.visibility,'hidden');
  assert.equal(m.tree.props.referrerPolicy,'no-referrer');
  const source={};m.slots[0].current={contentWindow:source};
  m.listeners.get('message')({origin:'https://evil.test',source,data:{eonWidgetMode:'conversation'}});
  assert.equal(m.render().props.style.visibility,'hidden');
  m.listeners.get('message')({origin:m.location.origin,source,data:{eonWidgetMode:'invitation'}});
  assert.equal(m.render().props.style.visibility,'visible');assert.equal(m.render().props.style.height,300);
  m.listeners.get('message')({origin:m.location.origin,source,data:{eonWidgetMode:'conversation'}});
  assert.equal(m.render().props.style.height,'100%');
  assert.equal(m.render().props.src,m.tree.props.src,'rerenders retain the same iframe document');
  m.cleanup();assert.equal(m.listeners.size,0);
});
test('widget host off by default, supplied script only, stable external IDs and no backend secret',async()=>{
  const off=loader()('app/api/negotiation/widget/route.ts');assert.equal((await off.GET()).status,404);
  const route=loader({}, {NEGOTIATION_WIDGET_ENABLED:'true',NEGOTIATION_PUBLIC_KEY:key,NEGOTIATION_CONNECTOR_SECRET:'never-expose-this'})('app/api/negotiation/widget/route.ts');
  const response=await route.GET(),html=await response.text();
  assert.match(html,/https:\/\/eon-negotiation.vercel.app\/widget.js/);
  assert.match(html,/data-product="arctic-wave"/);assert.match(html,/data-variant="arctic-wave:50ml"/);
  assert.doesNotMatch(html,/never-expose-this|negotiate\/start/);
  assert.match(response.headers.get('Content-Security-Policy'),/frame-ancestors 'self'/);
});
test('access fragments are removed before analytics without altering unrelated fragments',()=>{
  const {fragmentBootstrap}=loader()('lib/negotiation/browserBootstrap.ts');
  for(const [pathname,hash,expected] of [
    ['/products/arctic-wave-perfume','#eonTest=private-token','eon-test:'+key],
    ['/checkout/negotiated/'+key,'#'+'t'.repeat(43),'eon-checkout:'+key],
  ]) {
    const location={pathname,hash,search:''},saved={};let url='';
    vm.runInNewContext(fragmentBootstrap(key),{location,URLSearchParams,sessionStorage:{setItem:(k,v)=>saved[k]=v},history:{replaceState:(_a,_b,v)=>url=v}});
    assert.ok(saved[expected]);assert.equal(url,pathname);
  }
});
