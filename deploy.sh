#!/bin/bash

# AutoKosten Vergelijker - Deployment Script
# Synchroneert tussen Projects en GitHub folders en deployt naar live server

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project paths
PROJECTS_DIR="/Users/richardsurie/Documents/Development/Projects/autokostenvergelijker.nl"
GITHUB_DIR="/Users/richardsurie/Documents/Development/GitHub/autokostenvergelijker.nl"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if directory exists
check_directory() {
    if [ ! -d "$1" ]; then
        print_error "Directory does not exist: $1"
        exit 1
    fi
}

# Function to sync files
sync_files() {
    print_status "Syncing files from Projects to GitHub..."
    
    # Exclude files that shouldn't be synced
    rsync -av \
        --exclude='.git/' \
        --exclude='.DS_Store' \
        --exclude='PROJECT_STATUS_*.md' \
        --exclude='ARCHIVE_CHAT_*.md' \
        --exclude='*.log' \
        --exclude='*.cache' \
        --exclude='temp/' \
        --exclude='uploads/' \
        "$PROJECTS_DIR/" "$GITHUB_DIR/"
    
    if [ $? -eq 0 ]; then
        print_success "Files synced successfully"
    else
        print_error "File sync failed"
        exit 1
    fi
}

# Function to commit and push to GitHub
git_deploy() {
    local commit_message="$1"
    
    print_status "Deploying to GitHub..."
    
    cd "$GITHUB_DIR" || exit 1
    
    # Add all changes
    git add .
    
    # Check if there are changes to commit
    if git diff --staged --quiet; then
        print_warning "No changes to commit"
        return 0
    fi
    
    # Commit changes
    git commit -m "$commit_message"
    
    if [ $? -eq 0 ]; then
        print_success "Changes committed successfully"
    else
        print_error "Git commit failed"
        exit 1
    fi
    
    # Push to GitHub
    git push origin main
    
    if [ $? -eq 0 ]; then
        print_success "Changes pushed to GitHub successfully"
    else
        print_error "Git push failed"
        exit 1
    fi
}

# Function to show git status
show_status() {
    print_status "Current git status:"
    cd "$GITHUB_DIR" || exit 1
    git status --short
}

# Function to update project status
update_project_status() {
    local commit_message="$1"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    # Update PROJECT_STATUS in Projects directory (not synced to GitHub)
    if [ -f "$PROJECTS_DIR/PROJECT_STATUS_autokostenvergelijker.md" ]; then
        # Add deployment info to status
        echo "" >> "$PROJECTS_DIR/PROJECT_STATUS_autokostenvergelijker.md"
        echo "## 🚀 LAATSTE DEPLOYMENT" >> "$PROJECTS_DIR/PROJECT_STATUS_autokostenvergelijker.md"
        echo "- **Datum:** $timestamp" >> "$PROJECTS_DIR/PROJECT_STATUS_autokostenvergelijker.md"
        echo "- **Commit:** $commit_message" >> "$PROJECTS_DIR/PROJECT_STATUS_autokostenvergelijker.md"
        echo "- **Status:** Successfully deployed to autokostenvergelijker.nl" >> "$PROJECTS_DIR/PROJECT_STATUS_autokostenvergelijker.md"
        
        print_success "Project status updated"
    fi
}

# Main deployment function
deploy() {
    local commit_message="$1"
    
    # Validate commit message
    if [ -z "$commit_message" ]; then
        print_error "Commit message is required!"
        echo "Usage: $0 \"Your commit message here\""
        exit 1
    fi
    
    print_status "Starting deployment process..."
    echo "Commit message: $commit_message"
    echo ""
    
    # Check if directories exist
    check_directory "$PROJECTS_DIR"
    check_directory "$GITHUB_DIR"
    
    # Show current status
    show_status
    echo ""
    
    # Sync files
    sync_files
    echo ""
    
    # Git operations
    git_deploy "$commit_message"
    echo ""
    
    # Update project status
    update_project_status "$commit_message"
    echo ""
    
    print_success "🎉 Deployment completed successfully!"
    print_status "Your changes are now live at: https://autokostenvergelijker.nl"
    echo ""
    
    # Show final status
    print_status "Final git status:"
    show_status
}

# Help function
show_help() {
    echo "AutoKosten Vergelijker - Deployment Script"
    echo ""
    echo "Usage:"
    echo "  $0 \"commit message\"          Deploy with commit message"
    echo "  $0 --status                   Show current git status"
    echo "  $0 --sync                     Sync files only (no git operations)"
    echo "  $0 --help                     Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 \"Add homepage with 6 auto options\""
    echo "  $0 \"Fix mobile navigation bug\""
    echo "  $0 \"Update RDW API integration\""
}

# Parse command line arguments
case "$1" in
    --help|-h)
        show_help
        ;;
    --status|-s)
        show_status
        ;;
    --sync)
        print_status "Syncing files only..."
        check_directory "$PROJECTS_DIR"
        check_directory "$GITHUB_DIR"
        sync_files
        print_success "Sync completed"
        ;;
    *)
        deploy "$1"
        ;;
esac