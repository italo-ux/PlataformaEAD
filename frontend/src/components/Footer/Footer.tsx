import inovacaoLogo from "../../assets/footer/image 3.png";
import parceirosImage from "../../assets/footer/image 4.png";

function Footer() {
  return (
    <footer id="contato" className="bg-[#3B4660] text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          <div className="space-y-8">
            <div className="max-w-sm">
              <img
                src={inovacaoLogo}
                alt="Inovação Barueri"
                className="h-14 w-auto"
              />
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <p className="font-semibold text-white">Links Úteis</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <span>Portal Barueri</span>
                <span>Portal CIT</span>
                <span>Inovacao Barueri</span>
                <span>TV Inovacao Barueri</span>
                <span>Contact Us</span>
              </div>
            </div>

            <div className="space-y-1 text-sm text-slate-300">
              <p className="font-semibold text-white">Endereço</p>
              <p>Rua Campos Sales, 222</p>
              <p>Centro | Barueri/SP</p>
              <p>Telefone: +55 11 4198-5778</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <img
              src={parceirosImage}
              alt="CIT Centro de Inovação e Prefeitura de Barueri"
              className="w-full max-w-[320px] object-contain"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
