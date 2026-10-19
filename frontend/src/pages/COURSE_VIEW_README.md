# Tela de curso

`/courses/:courseId` consome `GET /cursos/:courseId/jornada`.

- Aluno sem matrícula vê a chamada para iniciar.
- Aluno matriculado recebe somente a URL das aulas liberadas.
- A YouTube IFrame API envia posições sequenciais; o backend deriva a cobertura
  usando a duração persistida no cadastro e o tempo de sessão, limitado a 2x.
- Ao concluir 90%, a próxima aula é liberada na resposta da mesma operação.
- Professor e administrador recebem modo de pré-visualização, sem matrícula.
- Curso concluído exibe download do certificado verificável.
