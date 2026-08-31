export default class OP2Item extends Item {
  /** Publica a descrição do item no chat, como uma ação simples de "usar item". */
  async enviarParaChat() {
    const descricao = this.system.descricao ?? this.system.mecanica ?? "";
    const conteudo = `<div class="op2e chat-item"><h3>${this.name}</h3>${descricao}</div>`;
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: conteudo
    });
  }
}
