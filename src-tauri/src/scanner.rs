use std::collections::HashSet;
use std::path::Path;
use walkdir::WalkDir;

const ROOT_SIGNATURES: &[(&str, &str)] = &[
    ("Cargo.toml", "Rust"),
    ("go.mod", "Go"),
    ("build.zig", "Zig"),
    ("shard.yml", "Crystal"),
    ("v.mod", "V"),
    ("CMakeLists.txt", "C/C++"),
    ("mix.exs", "Elixir"),
    ("rebar.config", "Erlang"),
    ("project.clj", "Clojure"),
    ("deps.edn", "Clojure"),
    ("rescript.json", "ReScript"),
    ("grain.json", "Grain"),
    ("pubspec.yaml", "Dart"),
    ("Package.swift", "Swift"),
    ("tauri.conf.json", "Tauri"),
    ("ionic.config.json", "Ionic"),
    ("build.gradle.kts", "Kotlin"),
    ("build.sbt", "Scala"),
    ("pom.xml", "Java"),
    ("build.gradle", "Java"),
    ("hardhat.config.js", "Solidity"),
    ("flake.nix", "Nix"),
    ("default.nix", "Nix"),
    ("artisan", "PHP (Laravel)"),
    ("composer.json", "PHP"),
    ("Gemfile", "Ruby"),
    ("manage.py", "Python"),
    ("pyproject.toml", "Python"),
    ("requirements.txt", "Python"),
    ("tsconfig.json", "TypeScript"),
    ("package.json", "JavaScript"),
    ("Makefile", "C/C++"),
];

const TECH_SIGNATURES: &[(&str, &str)] = &[
    ("Cargo.toml", "rust"),
    ("go.mod", "go"),
    ("build.zig", "zig"),
    ("shard.yml", "crystal"),
    ("mix.exs", "elixir"),
    ("rebar.config", "erlang"),
    ("phoenix", "phoenix"),
    ("pubspec.yaml", "dart"),
    ("Package.swift", "swift"),
    ("tauri.conf.json", "tauri"),
    ("ionic.config.json", "ionic"),
    ("build.gradle.kts", "kotlin"),
    ("pom.xml", "java"),
    ("build.gradle", "java"),
    ("hardhat.config.js", "solidity"),
    ("flake.nix", "nixos"),
    ("default.nix", "nixos"),
    ("artisan", "laravel"),
    ("composer.json", "php"),
    ("Gemfile", "ruby"),
    ("Gemfile.lock", "rails"),
    ("manage.py", "django"),
    ("requirements.txt", "python"),
    ("pyproject.toml", "python"),
    ("tsconfig.json", "typescript"),
    ("package.json", "nodejs"),
    ("next.config.js", "nextjs"),
    ("next.config.ts", "nextjs"),
    ("next.config.mjs", "nextjs"),
    ("nuxt.config.ts", "nuxtjs"),
    ("nuxt.config.js", "nuxtjs"),
    ("vite.config.ts", "vitejs"),
    ("vite.config.js", "vitejs"),
    ("angular.json", "angular"),
    ("svelte.config.js", "sveltejs"),
    ("tailwind.config.js", "tailwindcss"),
    ("tailwind.config.ts", "tailwindcss"),
    ("Dockerfile", "docker"),
    ("docker-compose.yml", "docker"),
    ("docker-compose.yaml", "docker"),
    (".eslintrc.json", "eslint"),
    (".eslintrc.js", "eslint"),
    ("jest.config.js", "jest"),
    ("jest.config.ts", "jest"),
    ("vitest.config.ts", "vitest"),
    ("webpack.config.js", "webpack"),
    ("schema.prisma", "prisma"),
    ("firebase.json", "firebase"),
    ("supabase", "supabase"),
    ("k8s", "kubernetes"),
    ("kubernetes.yaml", "kubernetes"),
    (".terraform", "terraform"),
    ("main.tf", "terraform"),
    (".git", "git"),
];

const IGNORED_DIRS: &[&str] = &[
    ".git",
    "node_modules",
    "target",
    "dist",
    "build",
    "vendor",
    ".venv",
    "venv",
    "__pycache__",
    ".next",
    ".nuxt",
    "out",
    "bin",
    "obj",
    ".idea",
    ".vscode",
    "_build",
    "deps",
];

fn extension_map() -> std::collections::HashMap<&'static str, &'static str> {
    std::collections::HashMap::from([
        ("rs", "Rust"), ("go", "Go"), ("py", "Python"), ("rb", "Ruby"),
        ("php", "PHP"), ("java", "Java"), ("kt", "Kotlin"), ("kts", "Kotlin"),
        ("scala", "Scala"), ("clj", "Clojure"), ("cljs", "Clojure"),
        ("cs", "C#"), ("fs", "F#"), ("swift", "Swift"), ("dart", "Dart"),
        ("lua", "Lua"), ("nim", "Nim"), ("zig", "Zig"), ("cr", "Crystal"),
        ("ex", "Elixir"), ("exs", "Elixir"), ("erl", "Erlang"), ("hrl", "Erlang"),
        ("hs", "Haskell"), ("ml", "OCaml"), ("mli", "OCaml"),
        ("re", "ReScript"), ("res", "ReScript"), ("gr", "Grain"),
        ("jl", "Julia"), ("sol", "Solidity"), ("tf", "Terraform"),
        ("html", "HTML"), ("htm", "HTML"), ("css", "CSS"), ("scss", "SCSS"),
        ("sass", "Sass"), ("less", "Less"), ("c", "C"), ("h", "C"),
        ("cpp", "C++"), ("cc", "C++"), ("cxx", "C++"), ("hpp", "C++"),
        ("m", "Objective-C"), ("mm", "Objective-C++"), ("sh", "Shell"),
        ("bash", "Shell"), ("ps1", "PowerShell"), ("sql", "SQL"),
        ("r", "R"), ("pl", "Perl"), ("pm", "Perl"), ("vue", "Vue"),
        ("svelte", "Svelte"), ("ts", "TypeScript"), ("tsx", "TypeScript"),
        ("js", "JavaScript"), ("jsx", "JavaScript"), ("mjs", "JavaScript"),
        ("cjs", "JavaScript"), ("v", "V"), ("nix", "Nix"), ("groovy", "Groovy"),
        ("gradle", "Java"), ("ipynb", "Jupyter Notebook"), ("elm", "Elm"),
        ("purs", "PureScript"), ("d", "D"), ("pas", "Pascal"), ("f90", "Fortran"),
        ("f95", "Fortran"), ("asm", "Assembly"), ("s", "Assembly"),
    ])
}

fn language_to_slug(language: &str) -> Option<&'static str> {
    match language {
        "Rust" => Some("rust"),
        "Go" => Some("go"),
        "Zig" => Some("zig"),
        "Crystal" => Some("crystal"),
        "Dart" => Some("dart"),
        "TypeScript" => Some("typescript"),
        "JavaScript" => Some("js"),
        "PHP" | "PHP (Laravel)" => Some("php"),
        "Ruby" => Some("ruby"),
        "Python" => Some("python"),
        "Elixir" => Some("elixir"),
        "Erlang" => Some("erlang"),
        "Lua" => Some("lua"),
        "Perl" => Some("perl"),
        "Vue" => Some("vuejs"),
        "Svelte" => Some("sveltejs"),
        "HTML" => Some("html5"),
        "CSS" | "SCSS" | "Sass" => Some("sass"),
        "Less" => Some("less"),
        "Java" => Some("java"),
        "Kotlin" => Some("kotlin"),
        "Scala" => Some("scala"),
        "Clojure" => Some("clojure"),
        "C#" => Some("csharp"),
        "Swift" => Some("swift"),
        "Solidity" => Some("solidity"),
        "Nix" => Some("nixos"),
        "Haskell" => Some("haskell"),
        "OCaml" => Some("ocaml"),
        "PureScript" => Some("purescript"),
        "R" => Some("r"),
        "Shell" => Some("bash"),
        "PowerShell" => Some("powershell"),
        "Assembly" => Some("nasm"),
        _ => None,
    }
}

pub fn detect_primary_language(root: &Path) -> String {
    for (signature, language) in ROOT_SIGNATURES {
        if root.join(signature).exists() {
            return language.to_string();
        }
    }
    detect_by_extension_scan(root).unwrap_or_else(|| "Unknown".to_string())
}

fn detect_by_extension_scan(root: &Path) -> Option<String> {
    let ext_map = extension_map();
    let mut counts: std::collections::HashMap<&str, usize> = std::collections::HashMap::new();

    let walker = WalkDir::new(root)
        .max_depth(6)
        .into_iter()
        .filter_entry(|entry| {
            entry
                .file_name()
                .to_str()
                .map(|name| !IGNORED_DIRS.contains(&name))
                .unwrap_or(true)
        })
        .filter_map(|entry| entry.ok())
        .take(5_000);

    for entry in walker {
        if !entry.file_type().is_file() {
            continue;
        }
        if let Some(ext) = entry.path().extension().and_then(|e| e.to_str()) {
            if let Some(lang) = ext_map.get(ext.to_lowercase().as_str()) {
                *counts.entry(*lang).or_insert(0) += 1;
            }
        }
    }

    counts
        .into_iter()
        .max_by_key(|(_, count)| *count)
        .map(|(lang, _)| lang.to_string())
}

pub fn detect_all_technologies(root: &Path, primary_language: &str) -> Vec<String> {
    let mut found: Vec<String> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();

    let push = |slug: &str, found: &mut Vec<String>, seen: &mut HashSet<String>| {
        if seen.insert(slug.to_string()) {
            found.push(slug.to_string());
        }
    };

    if let Some(slug) = language_to_slug(primary_language) {
        push(slug, &mut found, &mut seen);
    }

    for (signature, slug) in TECH_SIGNATURES {
        if root.join(signature).exists() {
            push(slug, &mut found, &mut seen);
        }
    }
    if let Ok(package_json) = std::fs::read_to_string(root.join("package.json")) {
        for (needle, slug) in [
            ("\"react\"", "react"),
            ("\"react-native\"", "reactnative"),
            ("\"expo\"", "expo"),
            ("\"express\"", "expressjs"),
            ("\"@nestjs/core\"", "nestjs"),
            ("\"graphql\"", "graphql"),
            ("\"electron\"", "electron"),
            ("\"@supabase/supabase-js\"", "supabase"),
            ("\"firebase\"", "firebase"),
            ("\"mongodb\"", "mongodb"),
            ("\"pg\"", "postgresql"),
            ("\"mysql\"", "mysql"),
            ("\"redis\"", "redis"),
            ("\"webpack\"", "webpack"),
        ] {
            if package_json.contains(needle) {
                push(slug, &mut found, &mut seen);
            }
        }
    }

    found
}
