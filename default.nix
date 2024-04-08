with import <nixpkgs> {};
stdenv.mkDerivation {
  name = "react-bootstrap-shell";
  buildInputs = with pkgs; [
    nodePackages.create-react-app
    nodePackages.typescript-language-server
    nodejs
    yarn
  ];
}
