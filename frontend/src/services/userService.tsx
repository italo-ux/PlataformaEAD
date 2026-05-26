export async function createUser(userData: any) {
    try {
        const response = await fetch('http://localhost:3000/user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        if (!response.ok) {
            throw new Error('Failed to create user');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

//login falso sem backend - alice
export async function loginUser(userData: any) {
    console.log("loginUser foi chamado", userData); // 👈 ADICIONA ISSO
  const { email, password } = userData;


  if (email === "admin@email.com" && password === "123456") {
    return { message: "Login sucesso", token: "fake-token-123" };
  }

  throw new Error("Email ou senha inválidos");
}