{
  description = "Flake shell";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = { self, nixpkgs, flake-parts, ... }@inputs:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      perSystem =
        { pkgs, system, ... }:
        {
          # importing package example
          # packages."x86_64-linux".default = 
          #   pkgs.callPackage (import ./default.nix) {};

          devShells.default = pkgs.mkShell {

            packages = with pkgs; [ nodejs chromium ];

            # inputsFrom = [ pkgs.bat ];
            shellHook = ''
              if [ ! -d "node_modules" ]; then
                echo "node_modules not found. Running npm install..."
                npm install
              fi
            '';

            PUPPETEER_SKIP_DOWNLOAD = true;

          };
        };
    };
}
