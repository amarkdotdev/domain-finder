import os

BASE_DIR = '/home/ubuntu/domain-finder'

FILES_TO_INCLUDE = [
    'README.md',
    'docker-compose.yml',
    'frontend/domain-finder-ui/index.html',
    'frontend/domain-finder-ui/Dockerfile',
    'frontend/domain-finder-ui/vite.config.js',
    'frontend/domain-finder-ui/package.json',
    'frontend/domain-finder-ui/eslint.config.js',
    'frontend/domain-finder-ui/src/About.jsx',
    'frontend/domain-finder-ui/src/App.css',
    'frontend/domain-finder-ui/src/index.css',
    'frontend/domain-finder-ui/src/About.css',
    'frontend/domain-finder-ui/src/main.jsx',
    'frontend/domain-finder-ui/src/App.jsx',
    'backend/requirements.txt',
    'backend/Dockerfile',
    'backend/main.py',
    'nginx/Dockerfile',
    'nginx/nginx.conf'
]

def print_selected_files(base_dir, files_to_include):
    for relative_path in files_to_include:
        full_path = os.path.join(base_dir, relative_path)
        print(f"\n# --- {relative_path} ---\n")
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()
                print(content)
        except Exception as e:
            print(f"[Could not read {relative_path}: {e}]")

if __name__ == '__main__':
    print_selected_files(BASE_DIR, FILES_TO_INCLUDE)
