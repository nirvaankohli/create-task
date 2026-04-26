import random

valid_cards = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]
values = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    "J": 10,
    "Q": 10,
    "K": 10,
}


def deal_card():
    return random.choice(valid_cards)


def calculate_hand_value(hand):
    total = 0
    aces = 0

    for card in hand:
        if card not in valid_cards:
            raise ValueError(f"Invalid card: {card}")

        if card == "A":
            aces += 1
        else:
            total += values[card]

    for _ in range(aces):
        if total + 11 <= 21:
            total += 11
        else:
            total += 1

    return total


def display_hands(player_hand, dealer_hand, hide_dealer=True):
    player_total = calculate_hand_value(player_hand)
    print(f"\nYour hand: {player_hand} (value: {player_total})")

    if hide_dealer:
        print(f"Dealer hand: ['{dealer_hand[0]}', '?']")
    else:
        dealer_total = calculate_hand_value(dealer_hand)
        print(f"Dealer hand: {dealer_hand} (value: {dealer_total})")


def get_bet(balance):
    while True:
        bet = input(f"You have ${balance}. Enter your bet: ")

        if not bet.isdigit():
            print("Please enter a whole number.")
            continue

        bet = int(bet)
        if bet <= 0:
            print("Bet must be greater than 0.")
        elif bet > balance:
            print("You cannot bet more than your balance.")
        else:
            return bet


def player_turn(player_hand, dealer_hand):
    while True:
        display_hands(player_hand, dealer_hand, hide_dealer=True)
        player_total = calculate_hand_value(player_hand)

        if player_total == 21:
            print("You got blackjack!")
            return player_total

        if player_total > 21:
            print("You busted.")
            return player_total

        choice = input("Do you want to hit or stand? (h/s) : ").lower()
        if choice == "h":
            player_hand.append(deal_card())
        elif choice == "s":
            return player_total
        else:
            print("Please enter 'h' or 's'.")


def dealer_turn(dealer_hand):
    while calculate_hand_value(dealer_hand) < 17:
        dealer_hand.append(deal_card())

    return calculate_hand_value(dealer_hand)


def settle_round(player_total, dealer_total, bet):
    if player_total > 21:
        print(f"You lose ${bet}.")
        return -bet

    if dealer_total > 21:
        print(f"Dealer busted. You win ${bet}.")
        return bet

    if player_total > dealer_total:
        print(f"You win ${bet}.")
        return bet

    if player_total < dealer_total:
        print(f"You lose ${bet}.")
        return -bet

    print("Push. Your bet is returned.")
    return 0


def play_blackjack():
    balance = 100

    print("Welcome to Blackjack.")
    print("You are playing against the dealer.")

    while balance > 0:
        bet = get_bet(balance)

        player_hand = [deal_card(), deal_card()]
        dealer_hand = [deal_card(), deal_card()]

        player_total = player_turn(player_hand, dealer_hand)

        if player_total <= 21:
            print("\nDealer's turn.")
            dealer_total = dealer_turn(dealer_hand)
        else:
            dealer_total = calculate_hand_value(dealer_hand)

        display_hands(player_hand, dealer_hand, hide_dealer=False)
        balance += settle_round(player_total, dealer_total, bet)
        print(f"New balance: ${balance}")

        if balance == 0:
            print("You are out of money.")
            break

        play_again = input("\nPlay another round? (y/n): ").lower()
        if play_again != "y":
            break

    print(f"You leave the table with ${balance}.")


play_blackjack()
