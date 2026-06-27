export function buildTreeData(arg) {
  const branches = [];
  const grounds = (arg.grounds || []).filter((g) => g.trim());
  if (grounds.length) branches.push({ label: "근거", value: grounds.join(" / ") });
  if ((arg.warrant || "").trim()) branches.push({ label: "전제·보강", value: arg.warrant });
  if ((arg.qualifier || "").trim()) branches.push({ label: "한정", value: arg.qualifier });
  if ((arg.rebuttal || "").trim()) branches.push({ label: "반례·반론", value: arg.rebuttal });
  return { claim: arg.claim || "(주장 없음)", branches };
}

export function renderTree(arg, container) {
  const tree = buildTreeData(arg);
  const branchesHtml = tree.branches
    .map(
      (b) => `
      <div class="tree-branch">
        <div class="tree-connector"></div>
        <div class="tree-node tree-node--branch">
          <span class="tree-label">${escapeHtml(b.label)}</span>
          <span class="tree-value">${escapeHtml(b.value)}</span>
        </div>
      </div>`
    )
    .join("");
  container.innerHTML = `
    <div class="tree">
      <div class="tree-node tree-node--claim">
        <span class="tree-label">주장</span>
        <span class="tree-value">${escapeHtml(tree.claim)}</span>
      </div>
      <div class="tree-branches">${branchesHtml}</div>
    </div>`;
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
