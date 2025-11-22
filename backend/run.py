import typer
from orchestrator import run_session
from stt import listen_for_question


app = typer.Typer()

@app.command()
def ask(
    question: str = typer.Argument(None, help="The question to ask the 5 inner voices"),
    voice: bool = typer.Option(False, "--voice", "-v", help="Use voice input instead of text")
):
    """Ask the 5 inner voices."""
    if voice:
        question = listen_for_question()
        if not question:
            print("No question received. Exiting.")
            return
    elif not question:
        print("Error: Please provide a question or use --voice flag")
        return
    
    run_session(question)

if __name__ == "__main__":
    app()
