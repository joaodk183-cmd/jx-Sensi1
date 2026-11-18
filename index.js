
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const comandos = [
  new SlashCommandBuilder()
    .setName("sensi")
    .setDescription("Gerar sensibilidade para Free Fire")
];

const aparelhos = [
  "Samsung A05", "Samsung A15", "Samsung A25",
  "Samsung A35", "Samsung A55",
  "Moto G24", "Moto G34", "Moto G54", "Moto G84",
  "Redmi 12", "Redmi Note 13", "Redmi Note 14",
  "Poco X5", "Poco X6",
  "iPhone 11", "iPhone 12", "iPhone 13",
  "iPhone 14", "iPhone 15", "Outro celular"
];

const estilos = [
  { label: "Puxada de capa", value: "capa" },
  { label: "Precisão", value: "precisao" },
  { label: "Equilibrado", value: "equilibrado" }
];

const sessoes = new Map();

function gerarSensi(modelo, estilo) {
  let base = 190;

  if (/iphone/i.test(modelo)) base = 195;
  if (/poco|redmi/i.test(modelo)) base = 195;
  if (/a05|a15|g24/i.test(modelo)) base = 185;

  const ajustes = {
    capa: [5, 0, -5, -10, -85, -65],
    precisao: [-10, -15, -20, -25, -90, -70],
    equilibrado: [0, -5, -10, -15, -85, -65]
  };

  const nomes = [
    "Geral",
    "Ponto vermelho",
    "Mira 2x",
    "Mira 4x",
    "AWM",
    "Olhadinha"
  ];

  return nomes.map((nome, i) => ({
    name: nome,
    value: Math.max(0, Math.min(200, base + ajustes[estilo][i]))
  }));
}

function menuAparelhos() {
  return new StringSelectMenuBuilder()
    .setCustomId("jx_aparelho")
    .setPlaceholder("📱 Escolha seu celular")
    .addOptions(
      aparelhos.map((nome, i) => ({
        label: nome,
        value: String(i)
      }))
    );
}

function menuEstilos() {
  return new StringSelectMenuBuilder()
    .setCustomId("jx_estilo")
    .setPlaceholder("🎯 Escolha seu estilo")
    .addOptions(estilos);
}

function criarPainel(modelo = "", estilo = "") {
  const embed = new EmbedBuilder()
    .setColor("#8500FF")
    .setTitle("🎯 JX SENSI")
    .setDescription(
      "Gere sua sensibilidade personalizada para Free Fire!\n\n" +
      `📱 **Celular:** ${modelo || "Não selecionado"}\n` +
      `🎮 **Estilo:** ${estilos.find(e => e.value === estilo)?.label || "Não selecionado"}\n\n` +
      "Selecione seu aparelho e seu estilo abaixo."
    )
    .setFooter({ text: "JX SENSI • Gerador automático" });

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(menuAparelhos()),
      new ActionRowBuilder().addComponents(menuEstilos())
    ]
  };
}

client.once("ready", async () => {
  console.log(`JX SENSI online: ${client.user.tag}`);

  const rest = new REST({ version: "10" })
    .setToken(process.env.DISCORD_TOKEN);

  const rota = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(
        client.user.id,
        process.env.GUILD_ID
      )
    : Routes.applicationCommands(client.user.id);

  await rest.put(rota, {
    body: comandos.map(c => c.toJSON())
  });

  console.log("Comando /sensi registrado!");
});

client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "sensi") {
      sessoes.set(interaction.user.id, {
        modelo: "",
        estilo: ""
      });

      return interaction.reply(criarPainel());
    }
  }

  if (!interaction.isStringSelectMenu()) return;

  const sessao = sessoes.get(interaction.user.id);

  if (!sessao) {
    return interaction.reply({
      content: "Use /sensi para iniciar uma nova configuração.",
      ephemeral: true
    });
  }

  if (interaction.customId === "jx_aparelho") {
    sessao.modelo = aparelhos[Number(interaction.values[0])];
  }

  if (interaction.customId === "jx_estilo") {
    sessao.estilo = interaction.values[0];
  }

  if (sessao.modelo && sessao.estilo) {
    const resultado = gerarSensi(
      sessao.modelo,
      sessao.estilo
    );

    const texto = resultado.map(item =>
      `**${item.name}:** ${item.value}`
    ).join("\n");

    const embed = new EmbedBuilder()
      .setColor("#8500FF")
      .setTitle("🔥 SUA SENSI JX")
      .setDescription(
        `📱 **Celular:** ${sessao.modelo}\n` +
        `🎮 **Estilo:** ${estilos.find(e => e.value === sessao.estilo).label}\n\n` +
        `${texto}\n\n` +
        "*Valores sugeridos. Teste e ajuste conforme seu aparelho.*"
      )
      .setFooter({ text: "JX SENSI • Configuração gerada!" });

    const botao = new ButtonBuilder()
      .setCustomId("jx_novamente")
      .setLabel("Gerar novamente")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Primary);

    return interaction.update({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(botao)
      ]
    });
  }

  return interaction.update(
    criarPainel(sessao.modelo, sessao.estilo)
  );
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "jx_novamente") {
    sessoes.delete(interaction.user.id);
    return interaction.update(criarPainel());
  }
});

client.login(process.env.DISCORD_TOKEN);
