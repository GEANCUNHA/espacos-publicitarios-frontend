document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("espacos-container");
  const contagemEl = document.getElementById("contagem");
  const filtroLoja = document.getElementById("filtro-loja");

  let todosEspacos = [];
  let todasMarcas = [];

  // Carrega os espaços e as marcas
  Promise.all([
    fetch("http://localhost:5000/espacos", { cache: "no-store" }).then(res => res.json()),
    fetch("http://localhost:5000/marcas").then(res => res.json())
  ])
    .then(([espacos, marcas]) => {
      todosEspacos = espacos;
      todasMarcas = marcas;

      preencherDropdownLojas(espacos);
      renderizarEspacos(espacos);
      atualizarContagem(espacos);
    })
    .catch(error => {
      console.error("Erro ao buscar dados:", error);
      container.innerHTML = "<p>Erro ao carregar os dados.</p>";
    });

  function preencherDropdownLojas(espacos) {
    const lojasUnicas = [...new Map(espacos.map(e => [e.loja, e.loja])).keys()];
    lojasUnicas.forEach(loja => {
      const option = document.createElement("option");
      option.value = loja;
      option.textContent = loja;
      filtroLoja.appendChild(option);
    });
  }

  filtroLoja.addEventListener("change", () => {
    const lojaSelecionada = filtroLoja.value;
    const filtrados = lojaSelecionada === "todas"
      ? todosEspacos
      : todosEspacos.filter(e => e.loja === lojaSelecionada);

    renderizarEspacos(filtrados);
    atualizarContagem(filtrados);
  });

  function renderizarEspacos(lista) {
    container.innerHTML = "";

    lista.forEach(espaco => {
      const card = document.createElement("div");
      card.classList.add("espaco-card");

      const statusClass = espaco.status.toLowerCase() === "disponível"
        ? "status-disponivel"
        : "status-ocupado";

      card.innerHTML = `
        <h2>${espaco.nome}</h2>
        <p class="espaco-info">🆔 <strong>ID:</strong> ${espaco.id}</p>
        <p class="espaco-info">📍 <strong>Status:</strong> <span class="${statusClass}">${espaco.status}</span></p>
        <p class="espaco-info">📝 <strong>Descrição:</strong> ${espaco.descricao}</p>
        <p class="espaco-info">🏬 <strong>Loja:</strong> ${espaco.loja}</p>
        <p class="espaco-info">🏢 <strong>Marca atual:</strong> <span class="marca-nome">${espaco.marca}</span></p>

        <div class="atualizar-container">
          <label for="select-${espaco.id}">Nova marca:</label>
          <select id="select-${espaco.id}">
            ${todasMarcas.map(m => `<option value="${m.id}">${m.nome}</option>`).join("")}
          </select>
          <button data-id="${espaco.id}" class="atualizar-btn">Atualizar marca</button>
          <button data-id="${espaco.id}" class="deletar-btn">🗑️ Excluir espaço</button>
          <p class="feedback" id="feedback-${espaco.id}"></p>
        </div>
      `;

      const atualizarBtn = card.querySelector(".atualizar-btn");
      const deletarBtn = card.querySelector(".deletar-btn");
      const select = card.querySelector("select");
      const feedback = card.querySelector(`#feedback-${espaco.id}`);

      atualizarBtn.addEventListener("click", () => {
        const novaMarcaId = parseInt(select.value);

        fetch(`http://localhost:5000/espacos/${espaco.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ marca_id: novaMarcaId })
        })
          .then(res => {
            if (!res.ok) throw new Error("Erro ao atualizar");
            return res.json();
          })
          .then(() => {
            feedback.textContent = "✅ Marca atualizada!";
            feedback.style.color = "green";
            return fetch("http://localhost:5000/espacos", { cache: "no-store" });
          })
          .then(res => res.json())
          .then(novosEspacos => {
            todosEspacos = novosEspacos;
            const lojaSelecionada = filtroLoja.value;
            const filtrados = lojaSelecionada === "todas"
              ? todosEspacos
              : todosEspacos.filter(e => e.loja === lojaSelecionada);

            renderizarEspacos(filtrados);
            atualizarContagem(filtrados);
          })
          .catch(() => {
            feedback.textContent = "❌ Erro ao atualizar.";
            feedback.style.color = "red";
          });
      });

      deletarBtn.addEventListener("click", () => {
        if (!confirm("Tem certeza que deseja excluir este espaço?")) return;

        fetch(`http://localhost:5000/espacos/${espaco.id}`, {
          method: "DELETE"
        })
          .then(res => {
            if (!res.ok) throw new Error("Erro ao excluir");
            return res.json();
          })
          .then(() => {
            return fetch("http://localhost:5000/espacos", { cache: "no-store" });
          })
          .then(res => res.json())
          .then(novosEspacos => {
            todosEspacos = novosEspacos;
            const lojaSelecionada = filtroLoja.value;
            const filtrados = lojaSelecionada === "todas"
              ? todosEspacos
              : todosEspacos.filter(e => e.loja === lojaSelecionada);

            renderizarEspacos(filtrados);
            atualizarContagem(filtrados);
          })
          .catch(() => {
            alert("Erro ao excluir espaço.");
          });
      });

      container.appendChild(card);
    });
  }

  function atualizarContagem(lista) {
    const total = lista.length;
    const disponiveis = lista.filter(e => e.status.toLowerCase() === "disponível").length;
    const ocupados = total - disponiveis;
    contagemEl.textContent = `Total: ${total} | Disponíveis: ${disponiveis} | Ocupados: ${ocupados}`;
  }

  fetch("https://fakestoreapi.com/products?limit=6")
    .then(res => res.json())
    .then(produtos => {
      const adsContainer = document.getElementById("ads");

      produtos.forEach(produto => {
        const ad = document.createElement("div");
        ad.classList.add("ad-card");

        ad.innerHTML = `
          <img src="${produto.image}" alt="${produto.title}" />
          <h3>${produto.title}</h3>
          <p>R$ ${produto.price.toFixed(2)}</p>
        `;

        adsContainer.appendChild(ad);
      });
    })
    .catch(error => {
      console.error("Erro ao carregar anúncios:", error);
    });

  const modal = document.getElementById("modal");
  const abrirModalBtn = document.getElementById("abrir-modal");
  const fecharModalBtn = document.getElementById("fechar-modal");
  const formNovo = document.getElementById("form-novo-espaco");

  abrirModalBtn.addEventListener("click", () => modal.style.display = "flex");
  fecharModalBtn.addEventListener("click", () => modal.style.display = "none");

  const selectLoja = document.getElementById("loja");
  const selectMarca = document.getElementById("marca");

  fetch("http://localhost:5000/espacos")
    .then(res => res.json())
    .then(espacos => {
      const mapaLojas = new Map();
      espacos.forEach(e => {
        if (!mapaLojas.has(e.loja)) {
          mapaLojas.set(e.loja, e.loja_id);
        }
      });

      mapaLojas.forEach((id, nome) => {
        const opt = document.createElement("option");
        opt.textContent = nome;
        opt.value = id;
        selectLoja.appendChild(opt);
      });
    });

  fetch("http://localhost:5000/marcas")
    .then(res => res.json())
    .then(marcas => {
      marcas.forEach(marca => {
        const opt = document.createElement("option");
        opt.textContent = marca.nome;
        opt.value = marca.id;
        selectMarca.appendChild(opt);
      });
    });

  formNovo.addEventListener("submit", (e) => {
    e.preventDefault();

    const dados = {
      nome: document.getElementById("nome").value,
      descricao: document.getElementById("descricao").value,
      status: document.getElementById("status").value,
      loja_id: parseInt(document.getElementById("loja").value),
      marca_id: parseInt(document.getElementById("marca").value)
    };

    fetch("http://localhost:5000/espacos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        modal.style.display = "none";
        return fetch("http://localhost:5000/espacos", { cache: "no-store" });
      })
      .then(res => res.json())
      .then(novosEspacos => {
        todosEspacos = novosEspacos;
        renderizarEspacos(todosEspacos);
        atualizarContagem(todosEspacos);
      })
      .catch(() => {
        document.getElementById("msg-post").textContent = "❌ Erro ao cadastrar espaço.";
      });
  });
});
