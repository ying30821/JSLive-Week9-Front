//import "bootstrap/dist/js/bootstrap.bundle";
window.bootstrap = require('bootstrap/dist/js/bootstrap.bundle.js');
import "./style/all.scss";

const api_path = "lumei";
const baseUrl = "https://livejs-api.hexschool.io";
const config = {
  headers: {
    Authorization: "tqzmDBpaXzXeRWNYwrtAdzGeSaT2"
  }
};
const constraints = {
  姓名: {
    presence: {
      message: "是必填欄位"
    },
  },
  電話: {
    presence: {
      message: "是必填欄位"
    },
    format: {
      pattern: "[0-9]+",
      message: "只能輸入數字"
    },
    length: {
      is: 10,
      message: "長度不正確"
    }
  },
  Email: {
    presence: {
      message: "是必填欄位",
    },
    email: {
      message: "不是正確格式"
    }
  },
  寄送地址: {
    presence: {
      message: "是必填欄位"
    },
  },
  交易方式: {
    presence: {
      message: "是必填欄位"
    },
  },
};
const loader = document.querySelector(".loader");
//const recommendWall = document.querySelector(".js-recommendWall")
const productList = document.querySelector(".js-productList");
const categorySelect = document.querySelector(".js-category")
const cartList = document.querySelector(".js-cartList");
const orderForm = document.querySelector(".js-orderForm");
const orderInputs = orderForm.querySelectorAll("input,select");
const orderBtn = document.querySelector(".js-orderBtn");
const alert = document.querySelector(".js-alert");
let cartQtyInputs;
let productData = [];
let cartData = [];
let errors = {};
init();

//初始化
function init() {
  console.clear();
  grabWall();
  getProductData();
  getCartData();
  productList.addEventListener("click", e => {
    e.preventDefault();
    if (!e.target.dataset.productId) return;
    addCartItem(e.target.dataset.productId);
  })
  cartList.addEventListener("click", e => {
    e.preventDefault();
    if (!e.target.closest("button")) return;
    let nowBtn = e.target.closest("button");

    if (!!nowBtn.dataset.cartId) {
      deleteCartItem(nowBtn.dataset.cartId);
    }
    if (nowBtn.dataset.btn === "deleteCart") {
      deleteAllCart();
    }
  })
  categorySelect.addEventListener("change", e => {
    filterProduct(e.target.value);
  })
  orderInputs.forEach((item) => {
    item.addEventListener("change", formValidate);
  })
  orderBtn.addEventListener("click", e => {
    e.preventDefault();
    formValidate();
    if (errors) return;
    if (cartData.carts.length === 0)
      return showDangerAlert("購物車為空");
    const name = orderForm.querySelector("#customerName");
    const tel = orderForm.querySelector("#customerTel");
    const email = orderForm.querySelector("#customerEmail");
    const address = orderForm.querySelector("#customerAddress");
    const payment = orderForm.querySelector("#customerPayment");
    const user = {
      name: name.value.trim(),
      tel: tel.value.trim(),
      email: email.value.trim(),
      address: address.value.trim(),
      payment: payment.value.trim(),
    }
    createOrder(user);
    orderForm.reset();
  })
}
//渲染商品畫面
function renderProduct(product) {
  let str = "";
  product.forEach(item => {
    str += `<div class="col-md-6 col-lg-3">
            <div class="card rounded-0 border-0 position-relative" data-category=${item.category}>
              <span class="card-tag">新品</span>
              <img
                src="${item.images}"
                class="" alt="${item.title}">
              <a href="#" class="btn btn-black rounded-0 mb-0.5" data-product-id=${item.id}>加入購物車</a>
              <div>
                <h4 class="h5">${item.title}</h4>
                <del class="h5">NT$${toCurrency(item.origin_price)}</del>
                <p class="h3">NT$${toCurrency(item.price)}</p>
              </div>
            </div>
          </div>
    `;
  });
  productList.innerHTML = str;
}
//篩選商品類別
function filterProduct(category) {
  const cacheData = productData.filter(function (item) {
    if (category === item.category) {
      return item;
    }
    if (!category) {
      return item;
    }
  })
  renderProduct(cacheData);
}
//渲染購物車畫面
function renderCart() {
  let cacheStr = "";
  if (cartData.carts.length == 0) {
    cacheStr = `<tr>
    <td colspan="5" class="h4">購物車目前無商品</td>
    </tr>`
  } else {
    cartData.carts.forEach((item) => {
      cacheStr += `<tr>
    <td colspan="2">
      <div class="d-flex">
        <div class="ratio ratio-1x1 w-max-80px me-0.5">
          <img
            src="${item.product.images}"
            alt="${item.product.title}" class="object-cover">
        </div>
        <p>${item.product.title}</p>
      </div>
    </td>
    <td>NT$${toCurrency(item.product.price)}</td>
    <td><input type="number" min="1" max="10" value="${item.quantity}" class="js-cartQtyInput form-control bg-light w-50"></td>
    <td>${toCurrency(item.product.price * item.quantity)}</td>
    <td>
      <button type="button" class="btn closeBtn" data-cart-id=${item.id}>
        <span class="material-icons-outlined fs-2">close</span>
      </button>
    </td>
  </tr>`
    });
  }
  let str = `
    <table class="table fs-5">
      <thead>
        <tr>
          <th scope="col" colspan="2" class="border-0 w-min-300px">品項</th>
          <th scope="col" class="border-0 w-min-150px">單價</th>
          <th scope="col" class="border-0 w-min-150px">數量</th>
          <th scope="col" class="border-0 w-min-150px">金額</th>
          <th scope="col" class="border-0 w-min-150px"></th>
        </tr>
      </thead>
      <tbody class="border-top-0">
      ${cacheStr}
      </tbody>
      <tfoot class="border-0">
        <tr>
          <td colspan="4" class="border-0"><button type="button"
              class="btn btn-outline-black ${cartData.carts.length == 0 ? `disabled` :''} px-1.25 py-0.625" data-btn="deleteCart">刪除所有品項</button>
          </td>
          <td class="border-0">總金額</td>
          <td class="border-0 h3">NT$${toCurrency(cartData.finalTotal)}</td>
        </tr>
      </tfoot>
    </table>
  `
  cartList.innerHTML = str;
  cartQtyInputs = Array.from(document.getElementsByClassName("js-cartQtyInput"));
  cartQtyInputs.forEach((item, index) => {
    item.addEventListener("blur", () => {
      if (item.value > 10)
        item.value = 10;
      if (item.value < 1)
        item.value = 1;
      let cartId = cartData.carts[index].id;
      let cartQty = parseInt(item.value);
      editCartQty(cartId, cartQty);
    });
    item.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        if (item.value > 10)
          item.value = 10;
        if (item.value < 1)
          item.value = 1;
        let cartId = cartData.carts[index].id;
        let cartQty = parseInt(item.value);
        editCartQty(cartId, cartQty);
      }
    })
  })
}
//驗證表單
function formValidate() {
  const inputs = orderForm.querySelectorAll('input');
  const msgs = orderForm.querySelectorAll('[data-msg]');
  inputs.forEach(item => item.classList.remove("is-invalid"));
  msgs.forEach(item => item.textContent = "");
  errors = validate(orderForm, constraints);
  //console.log(errors);
  if (errors) {
    Object.keys(errors).forEach(item => {
      const msg = orderForm.querySelector(`[data-msg=${item}]`);
      const input = orderForm.querySelector(`[name=${item}]`);
      input.classList.add("is-invalid");
      let str = "";
      if (errors[item].length > 1) {
        str = errors[item].join("<br>");
      } else {
        str = errors[item];
      }
      msg.innerHTML = str;
    })
  }
}
//顯示成功alert
function showScuessAlert(content) {
  let str = `<div class="alert alert-success d-flex align-items-center 
    w-255px position-fixed top-25 end-0 fade show" role="alert">
    <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Success:">
    <use xlink:href="#check-circle-fill"/>
    </svg>
    <div>${content}</div>
  </div>`;
  setTimeout(() => {
    alert.innerHTML = str
  }, 200);
  setTimeout(() => {
    let bsAlert = new bootstrap.Alert(alert.querySelector(".alert"));
    bsAlert.close();
  }, 1500);
}
//顯示失敗alert
function showDangerAlert(content) {
  let str = `<div class="alert alert-danger d-flex align-items-center w-255px 
  position-fixed top-25 end-0 fade show" role="alert">
    <svg class="bi flex-shrink-0 me-2" width="24" height="24" role="img" aria-label="Danger:">
      <use xlink:href="#exclamation-triangle-fill" />
    </svg>
    <div>${content}</div>
  </div>`;
  setTimeout(() => {
    alert.innerHTML = str
  }, 200);
  setTimeout(() => {
    let bsAlert = new bootstrap.Alert(alert.querySelector(".alert"));
    bsAlert.close();
  }, 1500);
}
//loader控制
function toggleLoader(show) {
  if (show)
    loader.style.display = "flex";
  else
    loader.style.display = "none";
}
//grab
function grabWall() {
  document.addEventListener('DOMContentLoaded', function () {
    const ele = document.querySelector('.js-recommendWall');
    ele.style.cursor = 'grab';
    let pos = {
      top: 0,
      left: 0,
      x: 0,
      y: 0
    };
    const mouseDownHandler = function (e) {
      ele.style.cursor = 'grabbing';
      ele.style.userSelect = 'none';
      pos = {
        left: ele.scrollLeft,
        top: ele.scrollTop,
        // Get the current mouse position
        x: e.clientX,
        y: e.clientY,
      };

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    };
    const mouseMoveHandler = function (e) {
      // How far the mouse has been moved
      const dx = e.clientX - pos.x;
      const dy = e.clientY - pos.y;

      // Scroll the element
      ele.scrollTop = pos.top - dy;
      ele.scrollLeft = pos.left - dx;
    };
    const mouseUpHandler = function () {
      ele.style.cursor = 'grab';
      ele.style.removeProperty('user-select');

      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };
    // Attach the handler
    ele.addEventListener('mousedown', mouseDownHandler);
  });
}
//產生千分位
function toCurrency(num) {
  let parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// api:取得產品列表
function getProductData() {
  toggleLoader(true);
  axios
    .get(`${baseUrl}/api/livejs/v1/customer/${api_path}/products`)
    .then((res) => {
      if (res.data.status) {
        //console.log("取得產品列表");
        productData = res.data.products;
        renderProduct(productData);
      }
    })
    .catch((err) => {
      if (!err.response.data.status) {
        console.error(err.response.data.message);
      }
    })
    .then(() => {
      toggleLoader(false);
    });
}
// api:加入購物車
function addCartItem(productid, productQty = 1) {
  toggleLoader(true);
  const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/carts`;
  const data = {
    data: {
      productId: productid,
      quantity: productQty,
    }
  };
  axios
    .post(url, data)
    .then((res) => {
      if (res.data.status) {
        //console.log("加入購物車");
        cartData = res.data;
        renderCart();
        showScuessAlert("已加入購物車");
      } else {
        console.error(res.data.message);
      }
    })
    .catch((err) => {
      if (!err.response.data.status) {
        console.error(err.response.data.message);
      }
    })
    .then(() => {
      toggleLoader(false);
    });
}
// api:取得購物車列表
function getCartData() {
  toggleLoader(true);
  axios
    .get(`${baseUrl}/api/livejs/v1/customer/${api_path}/carts`)
    .then((res) => {
      if (res.data.status) {
        //console.log("取得購物車列表");
        cartData = res.data;
        renderCart();
      }
    })
    .catch((err) => {
      if (!err.response.data.status) {
        console.error(err.response.data.message);
      }
    })
    .then(() => {
      toggleLoader(false);
    });
}
// api:編輯購物車產品數量
function editCartQty(cartid, cartQty) {
  toggleLoader(true);
  const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/carts`;
  const data = {
    data: {
      id: cartid,
      quantity: cartQty,
    }
  };
  axios
    .patch(url, data)
    .then((res) => {
      if (res.data.status) {
        //console.log("編輯購物車產品數量");
        cartData = res.data;
        renderCart();
        showScuessAlert("數量已更改");
      } else {
        console.error(res.data.message);
      }
    })
    .catch((err) => {
      if (!err.response.data.status) {
        console.error(err.response.data.message);
      }
    })
    .then(() => {
      toggleLoader(false);
    });
}
// api:刪除購物車內特定產品
function deleteCartItem(cartId) {
  const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/carts/${cartId}`;
  toggleLoader(true);
  axios
    .delete(url)
    .then((res) => {
      if (res.data.status) {
        //console.log("已刪除購物車內特定產品");
        cartData = res.data;
        renderCart();
        showScuessAlert("已刪除商品");

      } else {
        console.error(res.data.message);
      }
    })
    .catch((err) => {
      if (!err.response.data.status) {
        console.log(err.response.data.message);
      }
    })
    .then(() => {
      toggleLoader(false);
    });
}
// api:清除購物車內全部產品
function deleteAllCart() {
  const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/carts`;
  toggleLoader(true);
  axios
    .delete(url)
    .then((res) => {
      if (res.data.status) {
        //console.log("已清除購物車內全部產品");
        cartData = res.data;
        renderCart();
        showScuessAlert("已清空購物車");
      }
    })
    .catch((err) => {
      if (!err.response.data.status) {
        console.error(err.response.data.message);
      }
    })
    .then(() => {
      toggleLoader(false);
    });
}
// api:送出購買訂單
function createOrder(user) {
  toggleLoader(true);
  const url = `${baseUrl}/api/livejs/v1/customer/${api_path}/orders`;
  const data = {
    data: {
      user
    }
  };
  axios
    .post(url, data)
    .then((res) => {
      if (res.data.status) {
        getCartData();
        showScuessAlert("已送出訂單");
        //console.log("送出購買訂單");
      }
    })
    .catch((err) => {
      if (!err.response.data.status) {
        console.error(err.response.data.message);
      }
    })
    .then(() => {
      toggleLoader(false);
    });
}