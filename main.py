import typer
from orchestrator import run_session

app = typer.Typer()

@app.command()
def ask(question: str = typer.Argument(..., help="The question to ask the 5 inner voices")):
    """Ask the 5 inner voices."""
    run_session(question)

if __name__ == "__main__":
    app()
