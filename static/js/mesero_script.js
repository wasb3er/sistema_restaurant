// static/js/mesero_script.js
const mesas = [
  {id:1,status:'libre',order:[]},
  {id:2,status:'ocupado',order:[{name:'Lomo',price:20000},{name:'Ensalada',price:8000}]},
  {id:3,status:'pedido',order:[{name:'Pizza Familiar',price:17000}]},
  {id:4,status:'libre',order:[]}
];

const mesasGrid = document.getElementById('mesasGrid');
const panelTitle = document.getElementById('panelTitle');
const orderItems = document.getElementById('orderItems');
const totalAmount = document.getElementById('totalAmount');

let selectedMesa = null;

function renderMesas(){
  mesasGrid.innerHTML = '';
  mesas.forEach(m=>{
    const el = document.createElement('div');
    el.className = 'mesa ' + m.status;
    el.innerHTML = `<div>${m.id}</div><div>${m.status}</div>`;
    el.onclick = ()=>selectMesa(m.id);
    mesasGrid.appendChild(el);
  });
}

function selectMesa(id){
  selectedMesa = mesas.find(m=>m.id===id);
  panelTitle.textContent = 'Mesa ' + id;
  renderOrder(selectedMesa.order);
}

function renderOrder(items){
  orderItems.innerHTML = '';
  let total = 0;
  items.forEach(i=>{
    const row = document.createElement('div');
    row.textContent = i.name + ' - $' + i.price;
    orderItems.appendChild(row);
    total += i.price;
  });
  totalAmount.textContent = '$' + total;
}

renderMesas();
