const lb = document.getElementById("lb");
const lbImg = lb.querySelector("img");
document.querySelectorAll(".zoom").forEach((b) => {
  const img = b.querySelector("img");
  b.addEventListener("click", () => { lbImg.src = img.src; lbImg.alt = img.alt; lb.showModal(); });
});
lb.addEventListener("click", () => lb.close());

document.querySelectorAll("pre:not(.mermaid)").forEach((p) => {
  const b = document.createElement("button");
  b.className = "cp"; b.textContent = "Copy";
  b.addEventListener("click", () => {
    navigator.clipboard.writeText(p.querySelector("code").innerText);
    b.textContent = "Copied"; setTimeout(() => (b.textContent = "Copy"), 1400);
  });
  p.appendChild(b);
});

const links = new Map([...document.querySelectorAll(".side a")].map((a) => [a.dataset.id, a]));
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting || !links.has(e.target.id)) return;
    const a = links.get(e.target.id);
    document.querySelectorAll(".grp").forEach((g) => g.classList.remove("open"));
    links.forEach((l) => l.classList.remove("on"));
    a.classList.add("on");
    a.closest(".grp").classList.add("open");
  });
}, { rootMargin: "-20% 0px -70% 0px" });
document.querySelectorAll("main h2[id], main h3[id]").forEach((h) => io.observe(h));